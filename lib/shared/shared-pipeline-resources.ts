import {Duration, Stack} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Bucket, BucketEncryption, IBucket} from "aws-cdk-lib/aws-s3";
import {Topic} from "aws-cdk-lib/aws-sns";
import {Function, Runtime, Code} from "aws-cdk-lib/aws-lambda";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import {LOCAL_ENVIRONMENT} from "./environment";


export interface ISharedPipelineResources {
  bucket: IBucket
  discordNotificationTopic: Topic
}

export class SharedPipelineResources extends Stack implements ISharedPipelineResources {

  public bucket: IBucket
  public discordNotificationTopic: Topic

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.bucket = new Bucket(this, `artifact-bucket`, {
      bucketName: 'mckernant1-shared-artifacts',
      encryption: BucketEncryption.S3_MANAGED,
      versioned: false,
      lifecycleRules: [
        {
          enabled: true,
          expiration: Duration.days(2),

        }
      ]
    });

    this.discordNotificationTopic = new Topic(this, 'discord-notification-topic', {
      topicName: 'discord-notification-topic',
    });

    const discordNotificationLambda = new Function(this, 'discord-notification-lambda-function', {
      functionName: `discord-notification-lambda-function`,
      runtime: Runtime.PYTHON_3_13,
      handler: 'notify.lambda_handler',
      code: Code.fromAsset('lambda/discord-notifications', {
        bundling: {
          image: Runtime.PYTHON_3_13.bundlingImage,
          command: [
            'bash', '-c',
            `
            pip install -r requirements.txt -t /asset-output &&
            cp -au . /asset-output
            `
          ]
        }
      }),
      environment: {
        DISCORD_NOTIFICATION_WEBHOOK_URL: LOCAL_ENVIRONMENT.discordNotificationsWebhook,
        DISCORD_USER_TO_MENTION: LOCAL_ENVIRONMENT.discordUserToMention
      }
    });

    this.discordNotificationTopic.addSubscription(
      new LambdaSubscription(discordNotificationLambda)
    );
  }
}

import {Duration, Stack} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Bucket, BucketEncryption, IBucket} from "aws-cdk-lib/aws-s3";


export interface ISharedPipelineResources {
    bucket: IBucket
}

export class SharedPipelineResources extends Stack implements ISharedPipelineResources {


    public bucket: IBucket

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
        })


    }
}

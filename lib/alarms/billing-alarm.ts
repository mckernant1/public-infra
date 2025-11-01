import {Duration, Stack} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Alarm, ComparisonOperator, Metric, TreatMissingData} from "aws-cdk-lib/aws-cloudwatch";
import {SnsAction} from "aws-cdk-lib/aws-cloudwatch-actions";
import {Subscription, SubscriptionProtocol, Topic} from "aws-cdk-lib/aws-sns";
import {LOCAL_ENVIRONMENT} from "../shared/environment";


export class BillingAlarmStack extends Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id, {
            env: {
                region: 'us-east-1'
            }
        });

        const alarm = new Alarm(this, `total-cost-alarm`, {
            alarmName: 'BillingAlarm',
            metric: new Metric({
                namespace: 'AWS/Billing',
                metricName: 'EstimatedCharges',
                region: 'us-east-1',
                period: Duration.hours(6),
                statistic: 'Maximum',
                dimensionsMap: {
                    Currency: 'USD'
                }
            }),
            threshold: 50,
            evaluationPeriods: 1,
            comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treatMissingData: TreatMissingData.BREACHING,
            actionsEnabled: true
        });

        const billingTopic = new Topic(this, `notification-sns`, {
            displayName: 'billingTopic'
        });

        const emailSubscription = new Subscription(this, `email-subscription`, {
            topic: billingTopic,
            protocol: SubscriptionProtocol.EMAIL_JSON,
            endpoint: LOCAL_ENVIRONMENT.notificationEmail
        })

        alarm.addAlarmAction(new SnsAction(billingTopic));

    }
}

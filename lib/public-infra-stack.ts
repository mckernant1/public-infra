import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {MetricsPipeline} from "./pipelines/metrics-pipeline";
import {SharedPipelineResources} from "./shared/shared-pipeline-resources";
import {BillingAlarmStack} from "./alarms/billing-alarm";
import {KotlinUtilsPipeline} from "./pipelines/kotlin-utils-pipeline";

export class PublicInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sharedResources = new SharedPipelineResources(this, `shared-resources`)

    const metricsPipeline = new MetricsPipeline(this, `metrics-pipeline`, sharedResources);
    const kotlinUtilsPipeline = new KotlinUtilsPipeline(this, `kotlin-utils`, sharedResources);

    const billingAlarmEmail = new BillingAlarmStack(this, `billing-alarm`)

  }
}

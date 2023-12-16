import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {MetricsPipeline} from "./stacks/common/metrics-pipeline";
import {SharedPipelineResources} from "./stacks/shared-pipeline-resources";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PublicInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sharedResources = new SharedPipelineResources(this, `shared-resources`)

    const metricsPipeline = new MetricsPipeline(this, `metrics-pipeline`, sharedResources)

  }
}

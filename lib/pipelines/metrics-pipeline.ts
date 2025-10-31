import {PipelineBaseStack} from "./pipeline-base-stack";
import {Construct} from "constructs";
import {ISharedPipelineResources} from "../shared/shared-pipeline-resources";


export class MetricsPipeline extends PipelineBaseStack {

    constructor(scope: Construct, id: string, sharedResources: ISharedPipelineResources) {
        super(scope, id, sharedResources);

        const pipeline = this.defaultPipeline(
            'metrics',
            './gradlew build test',
          './gradlew release',
            './gradlew publish'
        );

    }


}

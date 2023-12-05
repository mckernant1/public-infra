import {PipelineBaseStack} from "../pipeline-base-stack";
import {Construct} from "constructs";


export class MetricsPipeline extends PipelineBaseStack {

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const pipeline = this.defaultPipeline('metrics', './gradlew build test publish');

    }


}

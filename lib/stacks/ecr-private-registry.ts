import {Stack} from "aws-cdk-lib";
import {Construct} from "constructs";
import {CfnPullThroughCacheRule} from "aws-cdk-lib/aws-ecr";


export class EcrPrivateRegistry extends Stack {

    constructor(scope: Construct, id: string) {
        super(scope, id);

        // Constructs are not there for this yet. Will wait...

        const dockerPullThroughCache = new CfnPullThroughCacheRule(this, `docker-hub-cache`, {
            ecrRepositoryPrefix: 'docker-hub',
            upstreamRegistry: 'docker-hub',
            upstreamRegistryUrl: 'registry-1.docker.io',
            credentialArn: 'arn:aws:secretsmanager:us-east-2:653528873951:secret:ecr-pullthroughcache/docker-hub-iaBRtp',

        });
    }

}

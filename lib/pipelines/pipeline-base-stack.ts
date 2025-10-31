import {Stack} from "aws-cdk-lib";
import {Construct} from "constructs";
import {
  BuildEnvironmentVariableType,
  BuildSpec,
  Cache,
  ComputeType,
  LinuxBuildImage,
  LocalCacheMode,
  PipelineProject,
  PipelineProjectProps,
  Project
} from "aws-cdk-lib/aws-codebuild";
import {
  Effect,
  IManagedPolicy,
  IRole,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal
} from "aws-cdk-lib/aws-iam";
import {CodeBuildAction, CodeStarConnectionsSourceAction} from "aws-cdk-lib/aws-codepipeline-actions";
import {PipelineProps, StageProps} from "aws-cdk-lib/aws-codepipeline/lib/pipeline";
import {Artifact, Pipeline} from "aws-cdk-lib/aws-codepipeline";
import {ISharedPipelineResources} from "../shared/shared-pipeline-resources";


export abstract class PipelineBaseStack extends Stack {

  protected owner: string = 'mckernant1'
  protected codestarConnectionsArn: string = 'arn:aws:codestar-connections:us-west-2:653528873951:connection/2add388e-bb26-48ea-992c-e5cee7ee4526';
  protected codeBuildRole: IRole;
  protected sharedResources: ISharedPipelineResources

  protected constructor(
    scope: Construct,
    id: string,
    sharedResources: ISharedPipelineResources
  ) {
    super(scope, id);
    this.sharedResources = sharedResources;
    this.codeBuildRole = new Role(this, `codebuild-role-${this.stackName}`, {
      roleName: `codebuild-role-${this.stackName}`,
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: this.managedPolicies,
      inlinePolicies: this.inlinePolicies
    });
  }

  protected get managedPolicies(): IManagedPolicy[] {
    return [
      ManagedPolicy.fromAwsManagedPolicyName('AWSCodeArtifactReadOnlyAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess')
    ]
  }

  protected get inlinePolicies(): { [name: string]: PolicyDocument } {
    return {
      "s3-publish": new PolicyDocument(
        {
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: ['arn:aws:s3:::mvn.mckernant1.com/*'],
              actions: [
                's3:PutObject',
                's3:GetObject'
              ]
            })
          ]
        }
      )
    };
  }

  protected get codebuildDefaults(): Partial<PipelineProjectProps> {
    return {
      role: this.codeBuildRole,
      environment: {
        buildImage: LinuxBuildImage.STANDARD_7_0,
        computeType: ComputeType.SMALL
      },
      environmentVariables: {
        GITHUB_TOKEN: {
          type: BuildEnvironmentVariableType.SECRETS_MANAGER,
          value: 'github/mckernant1-token:GITHUB_TOKEN'
        }
      },
      cache: Cache.local(LocalCacheMode.SOURCE, LocalCacheMode.CUSTOM)
    }
  }

  protected get pipelineDefaults(): Partial<PipelineProps> {
    return {
      artifactBucket: this.sharedResources.bucket
    }
  }


  protected defaultSourceStage(
    repo: string,
    sourceArtifact: Artifact
  ): StageProps {
    return {
      stageName: "Source",
      actions: [
        new CodeStarConnectionsSourceAction({
          output: sourceArtifact,
          repo,
          actionName: "Source",
          connectionArn: this.codestarConnectionsArn,
          owner: this.owner,
          branch: 'main',
        })
      ]
    };
  }

  protected defaultPublishStage(
    project: Project,
    sourceArtifact: Artifact
  ): StageProps {
    return {
      stageName: "Publish",
      actions: [
        new CodeBuildAction({
          actionName: 'Publish',
          project: project,
          input: sourceArtifact
        })
      ]
    }
  }

  protected defaultProject(
    repoName: string,
    ...commands: string[]
  ): Project {
    return new PipelineProject(this, `${this.stackName}-publish-project`, {
      ...this.codebuildDefaults,
      buildSpec: this.singleLineBuildspec(repoName, ...commands),
    })
  }

  protected defaultPipeline(
    repoName: string,
    ...commands: string[]
  ): Pipeline {
    const publishProject = this.defaultProject(repoName, ...commands);
    const sourceArtifact = Artifact.artifact('SourceArtifact');
    return new Pipeline(this, `${this.stackName}-pipeline`, {
      ...this.pipelineDefaults,
      stages: [
        this.defaultSourceStage(repoName, sourceArtifact),
        this.defaultPublishStage(publishProject, sourceArtifact)
      ]
    });
  }

  protected get cachePaths(): string[] {
    return [
      'build',
      '.gradle'
    ];
  }

  protected singleLineBuildspec(repoName: string, ...commands: string[]): BuildSpec {
    return BuildSpec.fromObject({
      version: "0.2",
      phases: {
        pre_build: {
          commands: [
            'echo Cloning full Git repository with submodules using CodeStar connection...',
            'rm -rf fullrepo',
            'git config --global url."https://$GITHUB_TOKEN@github.com/".insteadOf "https://github.com/"',
            `git clone --recurse-submodules https://github.com/${this.owner}/${repoName}.git fullrepo`,
            'cd fullrepo'
          ]
        },
        build: {
          commands: commands
        }
      },
      cache: {
        paths: this.cachePaths.map(it => `/root/${it}`)
      }
    })
  }
}

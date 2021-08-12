const core = require("@actions/core");
const github = require("@actions/github");
const LSS = require("./lss-internal");
const ZenHubApi = require("./zenhub-api");

const zenHubApi = new ZenHubApi();

async function run() {
  try {
    const repoId = core.getInput("repo_id");
    const event = core.getInput("event");
    const zhToken = core.getInput("zh_token");
    let status = "";

    console.log(`The event payload: ${JSON.stringify(github.context.payload)}`);

    //Branch or tag created
    if (event === "create") {
      console.log("Branch created trigger issue move");

      const refParts = github.context.payload.ref.split("/");
      const issueNumber = parseInt(
        refParts[refParts.length - 1].replace(/(^\d+)(.+$)/i, "$1"),
        10
      );
      const isValidIssueNumber = issueNumber > 0;
      if (isValidIssueNumber) {
        const pipelines = await zenHubApi.getIssuePipelines(
          issueNumber,
          repoId,
          zhToken
        );

        for (let index = 0; index < pipelines.length; index++) {
          const p = pipelines[index];
          const pipelineId = LSS.Workspaces[p.workspace_id]
            ? LSS.Workspaces[p.workspace_id]["InProgress"]
            : null;

          if (pipelineId) {
            console.log(
              `Moving issue #${issueNumber} to 'in progress' in workspace ${p.workspace_id})...`
            );

            await zenHubApi.moveValidIssue(
              p.workspace_id,
              repoId,
              issueNumber,
              pipelineId,
              zhToken
            );
          } else {
            console.log(
              `'in progress' Pipeline Id not in map for workspace ${p.workspace_id}.`
            );
          }
        }
      } else {
        console.log(`Invalid issue #`);
      }
      core.setOutput("output", status);
    } else if (event === "pull_request") {
      console.log("Pull request created moving issue to 'Out for PR'...");
      const ref = github.context.payload.pull_request.head.ref;
      const issueNumber = parseInt(ref.replace(/(^\d+)(.+$)/i, "$1"), 10);
      const isValidIssueNumber = issueNumber > 0;

      if (isValidIssueNumber) {
        const pipelines = await zenHubApi.getIssuePipelines(
          issueNumber,
          repoId,
          zhToken
        );

        for (let index = 0; index < pipelines.length; index++) {
          const p = pipelines[index];
          const pipelineId = LSS.Workspaces[p.workspace_id]
            ? LSS.Workspaces[p.workspace_id]["OutForPr"]
            : null;

          if (pipelineId) {
            console.log(
              `Moving issue #${issueNumber} to 'Out for PR' in workspace ${p.workspace_id})...`
            );

            await zenHubApi.moveValidIssue(
              p.workspace_id,
              repoId,
              issueNumber,
              pipelineId,
              zhToken
            );
          } else {
            console.log(
              `'Out for PR' Pipeline Id not in map for workspace ${p.workspace_id}.`
            );
          }
        }
      } else {
        console.log(`Invalid issue #`);
      }
      core.setOutput("output", status);
    }
  } catch (error) {
    console.log("-- Error --", error.message);
    core.setFailed(error.message);
  }
}

run();

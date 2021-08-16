const fetch = require("node-fetch");

module.exports = class ZenHubApi {
  checkStatus(res) {
    if (res.ok) {
      res.status >= 200 && res.status < 300;
      return res;
    } else {
      throw MyCustomError(res.statusText);
    }
  }

  async getIssuePipelines(issue_number, repo_id, zh_token) {
    try {
      var url = `https://api.zenhub.com/p1/repositories/${repo_id}/issues/${issue_number}`;
      const res = await fetch(url, {
        headers: {
          "X-Authentication-Token": zh_token,
        },
      });
      console.log("res", res);
      const json = await res.json();
      console.log("json", json);
      return json.pipelines;
    } catch (error) {
      console.log("error", JSON.stringify(error));
      console.log("Failed to get pipelines for issue", url, error.message);
    }
    return [];
  }

  async moveValidIssue(
    zhWorkspaceId,
    repoId,
    issue_number,
    pipelineId,
    zh_token
  ) {
    const url = `https://api.zenhub.com/p2/workspaces/${zhWorkspaceId}/repositories/${repoId}/issues/${issue_number}/moves`;
    const body = {
      pipeline_id: pipelineId,
      position: "top",
    };

    try {
      const result = await fetch(url, {
        method: "post",
        body: JSON.stringify(body),
        headers: {
          "X-Authentication-Token": zh_token,
          "Content-Type": "application/json",
        },
      });
      this.checkStatus(result);
      console.log("Issue moved successfully");
    } catch (error) {
      console.log("Failed to move issue:", url, body, error.message);
    }
  }
};

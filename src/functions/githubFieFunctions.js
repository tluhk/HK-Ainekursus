import base64 from "base-64";
import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.AUTH,
});

async function getFile(owner, repo, path) {
  const content = await octokit
    .request(`GET /repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
    .catch((err) => {
      console.log(err);
    });

  if (content && content.status === 200) {
    return {
      sha: content.data.sha,
      content: JSON.parse(base64.decode(content.data.content)),
    };
  }
  return false;
}

async function updateFile(owner, repo, path, file, commitMessage) {
  const upl = await octokit
    .request(`PUT /repos/${owner}/${repo}/contents/${path}`, {
      message: commitMessage,
      content: base64.encode(JSON.stringify(file.content)),
      sha: file.sha,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
    .catch((err) => {
      console.log(err);
    });

  return upl.status;
}

export { getFile, updateFile };

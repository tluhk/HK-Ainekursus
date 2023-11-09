import base64 from 'base-64';
import { Octokit } from 'octokit';
import utf8 from 'utf8';

const octokit = new Octokit({
  auth: process.env.AUTH
});

async function getFile(owner, repo, path, ref = null) {
  const content = await octokit.request(
    `GET /repos/${ owner }/${ repo }/contents/${ path }${ ref
      ? '?ref=' + ref
      : '' }`,
    {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  ).catch((err) => {
    console.log('err');
  });

  if (content && content.status === 200) {
    return {
      sha: content.data.sha,
      content: content.data.content
        ? utf8.decode(base64.decode(content.data.content))
        : ''
    };
  }
  return false;
}

async function getFolder(owner, repo, path, ref = null) {
  const content = await octokit.request(
    `GET /repos/${ owner }/${ repo }/contents/${ path }${ ref
      ? '?ref=' + ref
      : '' }`,
    {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  ).catch((err) => {
    console.log(err);
  });

  if (content && content.status === 200) {
    return content.data.filter((folder) => folder.type === 'dir')
      .map((folder) => {
        return {
          sha: folder.sha,
          name: folder.name
        };
      });
  }
  return false;
}

async function updateFile(
  owner,
  repo,
  path,
  file,
  commitMessage,
  branch = 'master'
) {
  return await octokit.request(
    `PUT /repos/${ owner }/${ repo }/contents/${ path }`, {
      message: commitMessage,
      content: base64.encode(file.content),
      sha: file.sha,
      branch: branch,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }).catch((err) => {
    console.log(err);
  });
}

async function deleteFile(
  owner,
  repo,
  path,
  sha,
  commitMessage,
  branch = 'master'
) {
  return await octokit.request(
    `DELETE /repos/${ owner }/${ repo }/contents/${ path }`, {
      message: commitMessage,
      sha: sha,
      branch: branch,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }).catch((err) => {
    console.log(err);
  });
}

async function uploadFile(
  owner,
  repo,
  path, // folder + new filename
  file, // req.files.file
  commitMessage,
  branch = 'master'
) {
  const base64Content = new Buffer.from(file.data).toString('base64');

  return await octokit.request(
    `PUT /repos/${ owner }/${ repo }/contents/${ path }`, {
      message: commitMessage,
      content: base64Content,
      branch: branch,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }).catch((err) => {
    console.log(err);
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export {
  getFile, updateFile, deleteFile, delay, getFolder, uploadFile
};

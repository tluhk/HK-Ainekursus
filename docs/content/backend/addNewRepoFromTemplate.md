**Uue ainekursuse lisamine**

- Kasutaja peab olema sisse loginud ja tal peab olema 'teacher' õigused,
- template repo nimi peab olema teada (.env failist?)
---
Sisendiks on kasutjalt vaja küsida:
- kursuse nime (sellele lisatakse automaatselt prefix - näit. 'HK_')
- kursuse ainekaardi linki õis'is
- semestrit


```mermaid
flowchart TD
start(["`Create a repository using a template
*octokit.request(POST /repos/{template_owner}/{template_repo}/generate* `"]) --> get(["`get config.json
*octokit.request('GET /repos/{owner}/{repo}/contents/{path}'*`"]) 
get --> upd["`update config.json
-replace **ÕIS url**
-replace **teacher**
-replace **semester**
-replace all **uuid's**`"]
upd-->upl(["`upload changed config.json
*octokit.request('PUT /repos/{owner}/{repo}/contents/{path}*'
`"])

```






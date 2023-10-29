**Uue haru lisamine ainekursusele**

- Kasutaja peab olema sisse loginud ja tal peab olema 'teacher' õigused,
---
Sisendiks on kasutjalt vaja küsida:
- kursust, millele on uut haru vaja
- uue haru nime
- millisest harust tehakse koopia (vaikimisi ``main``)


```mermaid
flowchart TD
start(["`Get repo sha
*octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}'* `"]) --> get(["`store sha from response 
*sha: 'aa218f56b14c9653891f9e74264a383fa43fefbd'*`"]) 
get --> new(["`create new brnach using: ref: 'refs/heads/newRepoName', sha `"])

```

``{owner}`` - tuleb .env failist (tluhk)

``{repo}`` - kursuse nimi millele uus haru lisada (koos "HK_" prefiksiga )

``{ref}`` - haru, millest tehakse koopia (main)





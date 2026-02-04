# 数据库初始化

mongo shell or mongo-init.js

```js
use webapp-template
db.createUser({
 user: "root",
 pwd: "Wxf1234321!",
 roles: [
    { role: "readWrite", db: "webapp-template" },
    { role: "dbAdmin", db: "webapp-template" }
  ]
})
```

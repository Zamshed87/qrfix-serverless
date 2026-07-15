# Push QRFix to GitHub

Create a new empty public repository named `qrfix-serverless` under the `Zamshed87` account. Do not initialize it with a README because this project already contains one.

Open PowerShell in the extracted project root and run:

```powershell
git init
git branch -M main
git add .
git commit -m "Add QRFix serverless AWS project"
git remote add origin https://github.com/Zamshed87/qrfix-serverless.git
git push -u origin main
```

If `origin` already exists:

```powershell
git remote set-url origin https://github.com/Zamshed87/qrfix-serverless.git
git push -u origin main
```

Before pushing, verify that secrets are not tracked:

```powershell
git status
git grep -n -i -E "aws_access_key_id|aws_secret_access_key|secret_key|password|token"
```

Expected sensitive local files are already ignored by `.gitignore`, including `.env`.

After pushing:

1. Open the repository on GitHub.
2. Confirm the README images load.
3. Add the live demo URL to the repository About section.
4. Add topics: `aws`, `serverless`, `lambda`, `api-gateway`, `dynamodb`, `cloudformation`, `aws-sam`, `react`, `vercel`, `devops`.
5. Pin the repository on your GitHub profile.

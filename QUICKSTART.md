# QRFix 30-Minute Quick Start

QRFix is a bilingual QR-based issue and maintenance reporting MVP.

## Architecture

```text
User / QR Scan
      |
      v
Vercel (React SPA)
      |
      v
Amazon API Gateway
      |
      v
AWS Lambda (Node.js 22, arm64)
      |
      v
Amazon DynamoDB
      |
      v
Amazon CloudWatch Logs
```

## 1. Deploy the AWS backend

Use AWS Console → CloudShell. Select `ap-south-1` before opening CloudShell.

Upload this ZIP to CloudShell, then:

```bash
unzip qrfix-serverless.zip
cd qrfix-serverless/backend

sam build

sam deploy \
  --stack-name qrfix-demo \
  --region ap-south-1 \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset
```

Get the API URL:

```bash
aws cloudformation describe-stacks \
  --stack-name qrfix-demo \
  --region ap-south-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text
```

Test:

```bash
API_URL="$(aws cloudformation describe-stacks \
  --stack-name qrfix-demo \
  --region ap-south-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)"

curl "$API_URL/health"
```

## 2. Run the frontend locally

On your computer:

```bash
cd qrfix-serverless/frontend
cp .env.example .env
```

Edit `.env` and set the API URL:

```env
VITE_API_URL=https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/Prod
```

Then:

```bash
npm install
npm run dev
```

Open the local URL and submit a ticket.

## 3. Deploy to Vercel

Push the `frontend` directory to GitHub, or run:

```bash
npm install -g vercel
cd frontend
vercel
```

In Vercel project settings, add:

```text
VITE_API_URL = your API Gateway URL
```

Redeploy after saving the variable.

## 4. Safe demo scope

The MVP intentionally has no admin authentication so it can be completed quickly.
Before a real customer deployment, add:

- Amazon Cognito authentication
- Tenant isolation
- S3 presigned image uploads
- API throttling and validation
- DynamoDB GSI instead of Scan
- CloudWatch alarms
- Custom domain and stricter CORS
- Backup/retention policies

## Cleanup

Delete the AWS resources when finished:

```bash
sam delete --stack-name qrfix-demo --region ap-south-1 --no-prompts
```

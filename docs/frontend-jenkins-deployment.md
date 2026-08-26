# Frontend Jenkins deployment

The production frontend is built by Jenkins, synchronized to the existing
frontend-only S3 bucket, and served after a CloudFront invalidation completes.
Jenkins checks `main` for changes with Poll SCM, so GitHub does not need inbound
network access to the Jenkins EC2 instance.

```text
main change
  -> Jenkins Poll SCM
  -> pnpm install and check
  -> Vite dist build
  -> frontend S3 sync
  -> CloudFront invalidation
```

## Required Jenkins configuration

Install or verify the following on the Jenkins EC2 instance:

- NodeJS plugin with a Node.js installation named `node24`
- Node.js 24
- Git and Pipeline plugins
- Credentials Binding plugin
- Pipeline: AWS Steps plugin

AWS CLI is not required. The Pipeline: AWS Steps plugin calls AWS APIs and the
Jenkins EC2 instance role supplies temporary credentials. Do not add an AWS
access key to this repository or to the pipeline.

Because Jenkins runs in Docker, configure the EC2 instance metadata options so
the container can retrieve the instance role credentials:

```text
IMDS endpoint: Enabled
IMDSv2: Required
Metadata response hop limit: 2
```

In **Manage Jenkins -> System -> AWS**, enable **Retrieve credentials from
node**. The `Jenkinsfile` also uses `withAWS(useNode: true)` so credentials are
resolved on the node running the pipeline.

Create these Jenkins credentials as **Secret text** values:

| Credential ID | Value |
| --- | --- |
| `stockfit-frontend-s3-bucket` | `stockfit-frontend-prod-7` |
| `stockfit-cloudfront-distribution-id` | `E226SCR3XTL20H` |

The bucket must be dedicated to the frontend. The pipeline uploads the current
`dist/` contents but does not delete older hashed assets. The current
`index.html` points only to the newest assets, so the old objects are harmless
and can be removed later with an S3 lifecycle rule. Never configure the
product-image bucket as this value.

Find the existing values in the AWS console:

1. Open **S3**, select the bucket used for the current manual frontend deploy,
   and copy its bucket name.
2. Open **CloudFront**, select the distribution whose alternate domain is
   `stockfit.win`, and copy its distribution ID.

## Jenkins EC2 role permission

Reuse the role attached to the Jenkins EC2 instance and add a least-privilege
policy with the real bucket, account, and distribution values:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FrontendBucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::stockfit-frontend-prod-7"
    },
    {
      "Sid": "FrontendObjectDeployment",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::stockfit-frontend-prod-7/*"
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::143924590050:distribution/E226SCR3XTL20H"
    }
  ]
}
```

The pipeline's **Verify AWS Role** stage calls `awsIdentity()` and fails before
deployment if the credentials do not belong to AWS account `143924590050`.
This replaces the previous AWS CLI verification command.

## Pipeline job

Create a Jenkins **Pipeline** job with these values:

```text
Definition: Pipeline script from SCM
SCM: Git
Repository URL: https://github.com/kosa11-final-project/FrontEnd.git
Branch Specifier: */main
Script Path: Jenkinsfile
```

For the first test before merging, temporarily use:

```text
Branch Specifier: */feature/YSK-180-front-auto
```

Run **Build Now** once and verify the checkout, AWS role, build, S3 upload, and
CloudFront invalidation stages. After the branch is merged, change the branch
specifier to `*/main`. The `Jenkinsfile` Poll SCM trigger checks for changes
approximately every two minutes and builds only when the configured branch
changes.

## Production API

The production build uses:

```text
VITE_API_BASE_URL=https://api.stockfit.win/api/
```

This matches the architecture where the browser calls the Nginx API domain
directly. If CloudFront is instead configured with an `/api/*` behavior that
forwards to Nginx, change the pipeline value back to `/api/` before deployment.

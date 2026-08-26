pipeline {
    agent any

    options {
        disableConcurrentBuilds(abortPrevious: true)
        skipDefaultCheckout(true)
        timestamps()
    }

    triggers {
        pollSCM('H/2 * * * *')
    }

    tools {
        nodejs 'node24'
    }

    environment {
        AWS_DEFAULT_REGION = 'ap-northeast-2'
        AWS_REGION = 'ap-northeast-2'
        AWS_ACCOUNT_ID = '143924590050'

        FRONTEND_BUCKET = 'stockfit-frontend-prod-7'
        CLOUDFRONT_DISTRIBUTION_ID = 'E226SCR3XTL2OH'

        VITE_API_BASE_URL = 'https://api.stockfit.win/api/'
        VITE_API_TIMEOUT_MS = '10000'
        VITE_INVENTORY_API_TIMEOUT_MS = '30000'
        VITE_CSRF_COOKIE_NAME = 'XSRF-TOKEN'
        VITE_CSRF_HEADER_NAME = 'X-XSRF-TOKEN'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare') {
            steps {
                sh '''
                    set -eu

                    test "$(node --version | cut -d. -f1)" = "v24"
                    corepack enable
                    corepack prepare pnpm@11.18.0 --activate
                    pnpm --version
                '''
            }
        }

        stage('Verify AWS Role') {
            steps {
                script {
                    withAWS(region: env.AWS_REGION, useNode: true) {
                        def identity = awsIdentity()

                        echo "AWS identity: ${identity.arn}"
                        if (identity.account != env.AWS_ACCOUNT_ID) {
                            error "Unexpected AWS account: ${identity.account}"
                        }
                    }
                }
            }
        }

        stage('Install') {
            steps {
                sh '''
                    set -eu
                    pnpm install --frozen-lockfile
                '''
            }
        }

        stage('Verify and Build') {
            steps {
                sh '''
                    set -eu
                    pnpm run check
                    test -f dist/index.html
                '''
            }
        }

        stage('Deploy to S3') {
            steps {
                withAWS(region: env.AWS_REGION, useNode: true) {
                    s3Upload(
                        bucket: env.FRONTEND_BUCKET,
                        path: '',
                        workingDir: 'dist',
                        includePathPattern: '**/*',
                        verbose: false
                    )

                    s3Upload(
                        file: 'dist/index.html',
                        bucket: env.FRONTEND_BUCKET,
                        path: 'index.html',
                        contentType: 'text/html; charset=utf-8',
                        cacheControl: 'no-cache, no-store, must-revalidate',
                        verbose: false
                    )
                }
            }
        }

        stage('Invalidate CloudFront') {
            steps {
                withAWS(region: env.AWS_REGION, useNode: true) {
                    cfInvalidate(
                        distribution: env.CLOUDFRONT_DISTRIBUTION_ID,
                        paths: ['/*'],
                        waitForCompletion: true
                    )
                }
            }
        }
    }

    post {
        success {
            echo "Frontend deployment succeeded: ${env.GIT_COMMIT}"
        }

        failure {
            echo "Frontend deployment failed: ${env.GIT_COMMIT}"
        }

        always {
            deleteDir()
        }
    }
}

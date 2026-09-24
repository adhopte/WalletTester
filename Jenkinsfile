@Library("jenkinsfile-templates-midsvcs") _

def mvnProfile = "snapshot"
boolean isRelease
boolean isHotfix
boolean isReleaseCandidate
def projectVersion
def buildNumber
def dockerRegistry
def dockerImage = 'sid/in-person-portal'

pipeline {
    agent {
            ecs {
                inheritFrom 'elastic-jenkins-agent'
                cpu 8192
                memory 16384
                image '586794466052.dkr.ecr.eu-central-1.amazonaws.com/elastic-agent:latest-jdk-21'
            }
    }
    parameters {
        choice(name: 'BUILD_TYPE',
                choices: ['Snapshot',
                          'Release',
                          'RC',
                          'Hotfix'],
                description: 'Pick build type.')
    }
    environment {
            NVM_DIR = "${WORKSPACE}/.nvm"
            NODE_VERSION = "23.9.0"
            CI = 'true'
    }


    stages {
        stage('Configure environment') {
                steps {
                    script {

                        sh '''
                            export NVM_DIR=$NVM_DIR
                            mkdir -p $NVM_DIR
                            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
                            . $NVM_DIR/nvm.sh
                            nvm install $NODE_VERSION
                            nvm use $NODE_VERSION
                            node -v
                            npm -v
                        '''

                        sh 'mvn --version'
                        def RC_BRANCH_PATTERN = /^(\d+\.\d+\.\d+)-Release-Candidate-(\d+)$/

                        isRCBranch = env.BRANCH_NAME ==~ RC_BRANCH_PATTERN
                        // Major release must be done on master branch
                        isRelease = params.BUILD_TYPE == 'Release' && env.BRANCH_NAME == 'master'
                        // Minor release can't be done on 'master' branch, 'develop' branch, feature branch or bugfix branch
                        isHotfix = params.BUILD_TYPE == 'Hotfix' && !['master', 'develop'].contains(env.BRANCH_NAME) && !env.BRANCH_NAME.toLowerCase().startsWith('feature') && !env.BRANCH_NAME.toLowerCase().startsWith('bugfix')
                        isReleaseCandidate = params.BUILD_TYPE == 'RC' && isRCBranch

                        scriptedMavenSteps.provideSettings()

                        // Retrieve project version
                        projectVersion = sh script: 'mvn help:evaluate -f helm/pom.xml -Dexpression=project.version -q -DforceStdout', returnStdout: true

                        if (isRelease || isHotfix) {
                            projectVersion = projectVersion.replace('-SNAPSHOT', '')

                            mvnProfile = "release"

                            dockerRegistry = 'smartidentities.jfrog.io/sid-docker-release'

                            buildNumber = projectVersion

                        } else if(isReleaseCandidate){

                            def matcher = env.BRANCH_NAME =~ RC_BRANCH_PATTERN
                            if (matcher.matches()) {
                                buildNumber = "${matcher[0][1]}-RC${matcher[0][2]}"
                            } else {
                                error "Branch naming does not match RC pattern!"
                            }
                            mvnProfile = "release"

                            dockerRegistry = 'smartidentities.jfrog.io/sid-docker-release'


                        }else {
                            // Calculate branch hash
                            def branchHash = java.security.MessageDigest.getInstance("MD5").digest(env.BRANCH_NAME.bytes).encodeHex().toString()

                            // Rename project version with git branch md5
                            projectVersion = projectVersion.replace('SNAPSHOT', branchHash + '-SNAPSHOT')

                            dockerRegistry = 'smartidentities.jfrog.io/sid-docker-snapshot'

                            // Get current date in French time zone
                            def currentDate = new Date().format('ddMMyyHHmmss', TimeZone.getTimeZone('Europe/Paris'))

                            // Rename build number with git branch md5 and current date
                            buildNumber = projectVersion.replace('SNAPSHOT', currentDate + '-SNAPSHOT')
                        }
                        println 'Project Version: ' + projectVersion
                        println 'Build Number: ' + buildNumber
                        println 'Docker Registry: ' + dockerRegistry

                        if (isHotfix) {
                            def lastDot = projectVersion.lastIndexOf('.')
                            def nextMinorDigit = Integer.parseInt(projectVersion.substring(lastDot + 1)) + 1
                            def nextMinorVersion = projectVersion.substring(0, lastDot + 1) + nextMinorDigit + '-SNAPSHOT'
                            println 'nextMinorVersion: ' + nextMinorVersion
                        }

                        currentBuild.displayName = projectVersion
                    }
                }


        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    . $NVM_DIR/nvm.sh && nvm use $NODE_VERSION
                    npm ci
                '''
            }
        }

        stage('Build') {
            steps {
                sh '''
                    . $NVM_DIR/nvm.sh && nvm use $NODE_VERSION
                    npm run build -- --configuration=production
                '''
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    sh 'ls -la dist/'


                    scriptedDockerSteps.login(dockerRegistry)

                        sh """
                            docker build -t ${dockerRegistry}/${dockerImage}:${buildNumber} .
                            docker push ${dockerRegistry}/${dockerImage}:${buildNumber}
                        """


                }
            }
        }

        stage('Build and deploy helm chart') {
            steps {
                dir('helm') {
                    withCredentials([usernamePassword(credentialsId: 'service-acc/jenkins_smart_identities_rw/smartidentities.jfrog.io', passwordVariable: 'HELM_PASSWORD', usernameVariable: 'HELM_USERNAME')]) {
                        sh 'helm repo add helm-snapshot  https://smartidentities.jfrog.io/artifactory/sid-helm-snapshot  --username $HELM_USERNAME --password $HELM_PASSWORD'
                        sh 'helm repo add helm-release  https://smartidentities.jfrog.io/artifactory/sid-helm-release  --username $HELM_USERNAME --password $HELM_PASSWORD'

                        sh 'helm repo update'

                        sh "mvn --batch-mode clean install -P${mvnProfile} -DbuildNumber=${buildNumber} -DDOCKER_REGISTRY=${dockerRegistry} -DDOCKER_IMAGE=${dockerImage} -DDOCKER_TAG=${buildNumber}"

                        sh "echo 'To be uploaded' | (cd target/helm/repo ; ls)"
                        sh "mvn --batch-mode -P${mvnProfile} helm:upload"
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}


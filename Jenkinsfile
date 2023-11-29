pipeline {
    agent any

    environment {
        JOB_NAME_PATH = "${env.JOB_NAME.replace('/', '_')}"
        WORKSPACE_LOCATION = "/var/www/html/jenkins-project/${JOB_NAME_PATH}"
    }

    stages {
        stage () {
            steps {
                dir(WORKSPACE_LOCATION) {
                    checkout scm
                    echo 'Success Github Clone And Change Folder'
                }
            }
        }

         stage ('Remove Docker Old Build') {
            steps {
                dir(WORKSPACE_LOCATION) {
                    sh 'docker rm apicleanearth -f'
                    sh 'docker rmi apicleanearth:latest -f'
                }
            }
        }

        stage ('building docker images') {
            steps {
                dir(WORKSPACE_LOCATION) {
                    sh 'docker build -t apicleanearth:latest .'
                    sh 'docker image prune -f'
                }
            }
        }

        stage ('running docker container') {
            steps {
                dir(WORKSPACE_LOCATION) {
                    sh 'docker run -p 127.0.0.1:6000:3000 --restart on-failure --name apicleanearth -d apicleanearth:latest '
                }
            }
        }
    }
}
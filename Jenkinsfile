pipeline {
    agent any

    environment {
        IMAGE_NAME = 'auth-demo-api-view'
        TAG = 'latest'
        TAR_NAME = 'image.tar'
    }

    stages {
        stage('Load Secrets') {
            steps {
                withCredentials([
                    string(credentialsId: 'port', variable: 'PORT'),
                    string(credentialsId: 'mongo-uri', variable: 'MONGO_URI'),
                    string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'session-secret', variable: 'SESSION_SECRET')
                ]) {
                    script {
                        env.PORT = PORT
                        env.MONGO_URI = MONGO_URI
                        env.JWT_SECRET = JWT_SECRET
                        env.SESSION_SECRET = SESSION_SECRET
                    }
                }
            }
        }

        stage('Create .env') {
            steps {
                writeFile file: '.env', text: """
PORT=${PORT}
MONGO_URI=${MONGO_URI}
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
"""
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:$TAG .'
            }
        }

        stage('Save Docker Image to .tar') {
            steps {
                sh 'docker save -o $TAR_NAME $IMAGE_NAME:$TAG'
            }
        }

        stage('Copy Image and .env to EC2') {
            steps {
                sshagent (credentials: ['ec2-ssh-key']) {
                    sh """
                        scp -o StrictHostKeyChecking=no $TAR_NAME ubuntu@54.255.40.151:/home/ubuntu/
                        scp -o StrictHostKeyChecking=no .env ubuntu@54.255.40.151:/home/ubuntu/
                    """
                }
            }
        }

        stage('Deploy on EC2') {
            steps {
                sshagent (credentials: ['ec2-ssh-key']) {
                    sh """
ssh -o StrictHostKeyChecking=no ubuntu@54.255.40.151 <<EOF
docker stop webapp || true
docker rm webapp || true
docker load -i /home/ubuntu/$TAR_NAME
docker run -d --env-file /home/ubuntu/.env -p 127.0.0.1:8000:${PORT} --name webapp ${IMAGE_NAME}:${TAG}
EOF
                    """
                }
            }
        }
    }
}

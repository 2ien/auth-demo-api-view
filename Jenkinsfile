pipeline {
    agent any

    environment {
        IMAGE_NAME = 'auth-demo-api-view'
        TAG = 'latest'
        DOCKERHUB_USER = 'nguyenlevanquyen'
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
PORT=$PORT
MONGO_URI=$MONGO_URI
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
"""
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $DOCKERHUB_USER/$IMAGE_NAME:$TAG .'
            }
        }

        stage('Run Container') {
            steps {
                sh '''
                    docker stop webapp || true
                    docker rm webapp || true
                    docker run -d --env-file .env -p 8000:$PORT --name webapp $DOCKERHUB_USER/$IMAGE_NAME:$TAG
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent (credentials: ['ec2-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@47.129.41.236 << 'EOF'
                        docker stop webapp || true
                        docker rm webapp || true
                        docker pull nguyenlevanquyen/auth-demo-api-view:latest

                        echo "PORT=$PORT" > /home/ubuntu/.env
                        echo "MONGO_URI=$MONGO_URI" >> /home/ubuntu/.env
                        echo "JWT_SECRET=$JWT_SECRET" >> /home/ubuntu/.env
                        echo "SESSION_SECRET=$SESSION_SECRET" >> /home/ubuntu/.env

                        docker run -d --env-file /home/ubuntu/.env -p 8000:$PORT --name webapp nguyenlevanquyen/auth-demo-api-view:latest
                        EOF
                    '''
                }
            }
        }
    }
}

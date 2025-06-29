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
                sh 'docker stop webapp || true'
                sh 'docker rm webapp || true'
                sh 'docker run -d --env-file .env -p 8000:$PORT --name webapp $DOCKERHUB_USER/$IMAGE_NAME:$TAG'
            }
        }
    }
}

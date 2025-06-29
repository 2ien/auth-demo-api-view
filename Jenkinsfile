pipeline {
    agent any

    environment {
        IMAGE_NAME = 'auth-demo-api-view'
        TAG = 'latest'
        DOCKERHUB_USER = 'nguyenlevanquyen'
    }

    stages {
        stage('Create .env') {
            steps {
                withCredentials([
                    string(credentialsId: 'port', variable: 'PORT'),
                    string(credentialsId: 'mongo-uri', variable: 'MONGO_URI'),
                    string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'session-secret', variable: 'SESSION_SECRET')
                ]) {
                    writeFile file: '.env', text: """
                    PORT=$PORT
                    MONGO_URI=$MONGO_URI
                    JWT_SECRET=$JWT_SECRET
                    SESSION_SECRET=$SESSION_SECRET
                    """
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $DOCKERHUB_USER/$IMAGE_NAME:$TAG .'
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-cred',
                    usernameVariable: 'DOCKERHUB_USER',
                    passwordVariable: 'DOCKERHUB_PASS'
                )]) {
                    sh 'echo $DOCKERHUB_PASS | docker login -u $DOCKERHUB_USER --password-stdin'
                    sh 'docker push $DOCKERHUB_USER/$IMAGE_NAME:$TAG'
                }
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

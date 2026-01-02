pipeline {
  agent any

  environment {
    REGISTRY = "docker.io/yuvan77"
    TAG = "${BUILD_NUMBER}"
  }

  stages {
    stage("Docker Login") {
      steps {
        withCredentials([
          usernamePassword(
            credentialsId: 'dockerhub-creds',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
          )
        ]) {
           sh '''
           echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
          '''
        }
      }
    }

    stage("Build & Push Backend") {
      steps {
        sh """
        docker build -t $REGISTRY/contact-backend:$TAG backend
        docker push $REGISTRY/contact-backend:$TAG
        """
      }
    }

    stage("Build & Push Frontend") {
      steps {
        sh """
        docker build -t $REGISTRY/contact-frontend:$TAG frontend
        docker push $REGISTRY/contact-frontend:$TAG
        """
      }
    }

    stage("Update GitOps Repo") {
      steps {
        withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
          sh """
          git clone https://$GITHUB_TOKEN@github.com/yuvankrishnarn-dotcom/contact-gitops.git
          cd contact-gitops/apps/contact

          sed -i 's|contact-backend:.*|contact-backend:$TAG|' backend.yaml
          sed -i 's|contact-frontend:.*|contact-frontend:$TAG|' frontend.yaml

          git config user.email "ci@jenkins"
          git config user.name "jenkins"
          git commit -am "Deploy version $TAG"
          git push
          """
        }
      }
    }
  }
}

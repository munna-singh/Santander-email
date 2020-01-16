#!groovy
@Library('gale43-library') _

/**
 * The _ here is intentional. Java/Groovy Annotations such as @Library must be applied to an element.
 * That is often a using statement, but that isn’t needed here so by convention we use an _.
 */

def jenkinsFileApplication

stage('Injecting Remote Workflows') {
  // jenkinsFileSonarQube = fileLoader.fromGit('Generic/SonarQube/application', 'https://github.com/gale43/Gale-Jenkins', 'develop', 'bb4baefc-b970-4cb0-ad23-9e5a955624ea', '')
  jenkinsFileApplication = fileLoader.fromGit('Santander/application', 'https://github.com/gale43/Gale-Jenkins', 'develop', 'bb4baefc-b970-4cb0-ad23-9e5a955624ea', '')
}

pipeline {
  agent {
    node {
      label 'Slave01||Slave02'
    }
  }

  environment {
    PROJECT = 'Gale43/Santander-email'
  }

  stages {
    stage('Generic') {
      steps {
        checkout(
            changelog: false,
            poll: false,
            scm: [
              $class: 'GitSCM',
              branches: [
                [
                  name: '*/develop'
                ]
              ],
              doGenerateSubmoduleConfigurations: false,
              extensions: [
                [
                  $class: 'RelativeTargetDirectory',
                  relativeTargetDir: '.Build-Dir'
                ]
              ],
              submoduleCfg: [],
              userRemoteConfigs: [
                [
                  credentialsId: 'bb4baefc-b970-4cb0-ad23-9e5a955624ea',
                  url: 'https://github.com/Gale43/Gale-Jenkins'
                ]
              ]
          ])
        script {
          // jenkinsFileSonarQube.analysis()
          if (!env.CHANGE_ID)
          {
            jenkinsFileApplication.stage()
          }
        }
      }
    }
  }

  post {
    always {
      echo 'One way or another, I have finished'
      deleteDir()
    }
    success {
      script {
        if (env.WEBHOOK_URL)
        {
          office365ConnectorSend message:"success ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)", status:"SUCCESS", webhookUrl:"$WEBHOOK_URL", color: "009900"
        }
      }
    }
    failure {
      script {
        if (env.WEBHOOK_URL)
        {
          office365ConnectorSend message:"failed ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)", status:"FAILED", webhookUrl:"$WEBHOOK_URL", color: "ED1C24"
        }
      }
    }
  }
}

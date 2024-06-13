yarn build
rsync -avz --info=progress2 -e  "ssh -i ~/.ssh/fm-server.pem" .next/ ubuntu@ec2-18-233-157-127.compute-1.amazonaws.com:/home/ubuntu/S-Pool/pool-scoring-ui/.next
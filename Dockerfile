# Vue.js 프론트엔드용 Dockerfile
FROM node:18-alpine

WORKDIR /app

# package.json과 package-lock.json 복사
COPY vue-project/package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY vue-project/ .

# 개발 서버 실행
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

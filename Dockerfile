# Stage 1: Cache Gradle dependencies
FROM gradle:latest AS cache
RUN mkdir -p /home/gradle/cache_home
ENV GRADLE_USER_HOME=/home/gradle/cache_home
COPY build.gradle.* gradle.properties /home/gradle/app/
COPY gradle /home/gradle/app/gradle
WORKDIR /home/gradle/app
RUN gradle clean build -i --stacktrace

# Stage 2: Build Application
FROM gradle:latest AS build
COPY --from=cache /home/gradle/cache_home /home/gradle/.gradle
COPY . /usr/src/app/
WORKDIR /usr/src/app
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
RUN gradle shadowJar --no-daemon

# Stage 3: Create the Runtime Image
FROM amazoncorretto:22  AS runtime
EXPOSE 8080
RUN mkdir /app

ENV PG_QUEENS_URL="localhost:5432/guest"
ENV PG_QUEENS_USER="guest"
ENV PG_QUEENS_PASSWD="guest"

COPY --from=build /home/gradle/src/build/libs/*.jar /app/sleeping-queens.jar
ENTRYPOINT ["java","-jar","/app/sleeping-queens.jar"]

# docker run -e PG_QUEENS_URL='188.134.66.139:9000/serge' tochoz/sleeping-queens
# docker build -t tochoz/sleeping-queens .
# Base Image
FROM ubuntu:22.04

MAINTAINER VDJServer <vdjserver@utsouthwestern.edu>

# PROXY: uncomment these lines if building behind UTSW proxy
# PROXY: DO NOT COMMIT WITH PROXY ON
# PROXY: look for other lines below marked PROXY:
#ENV http_proxy 'http://proxy.swmed.edu:3128/'
#ENV https_proxy 'https://proxy.swmed.edu:3128/'
#ENV HTTP_PROXY 'http://proxy.swmed.edu:3128/'
#ENV HTTPS_PROXY 'https://proxy.swmed.edu:3128/'

# Install OS Dependencies
RUN DEBIAN_FRONTEND='noninteractive' apt-get update && DEBIAN_FRONTEND='noninteractive' apt-get install -y \
    make \
    gcc g++ \
    wget \
    xz-utils \
    python3 \
    python3-pip

RUN pip3 install \
    requests \
    python-dotenv

##################
##################

# node
ENV NODE_VER v18.17.1
#ENV NODE_VER v12.18.3
RUN wget https://nodejs.org/dist/$NODE_VER/node-$NODE_VER-linux-x64.tar.xz
RUN tar xf node-$NODE_VER-linux-x64.tar.xz
RUN cp -rf /node-$NODE_VER-linux-x64/bin/* /usr/bin
RUN cp -rf /node-$NODE_VER-linux-x64/lib/* /usr/lib
RUN cp -rf /node-$NODE_VER-linux-x64/include/* /usr/include
RUN cp -rf /node-$NODE_VER-linux-x64/share/* /usr/share

# PROXY: More UTSW proxy settings
#RUN npm config set proxy http://proxy.swmed.edu:3128
#RUN npm config set https-proxy http://proxy.swmed.edu:3128

##################
##################

# Copy project source
RUN mkdir /airr-standards
COPY airr-standards /airr-standards
RUN cd /airr-standards/lang/js && npm install --unsafe-perm

# Copy project source
RUN mkdir /vdjserver-schema
COPY vdjserver-schema /vdjserver-schema
RUN cd /vdjserver-schema && npm install

# ESLint
RUN cd /vdjserver-schema && npm run eslint .


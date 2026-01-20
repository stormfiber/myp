FROM quay.io/qasimtech/mega-bot:latest

RUN git clone https://github.com/stormfiber/myp /root/myp && \
    rm -rf /root/myp/.git

WORKDIR /root/myp
RUN npm install || yarn install

EXPOSE 5000
CMD ["npm", "start"]

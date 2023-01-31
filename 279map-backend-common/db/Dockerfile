from mysql:5.7

COPY ./init/* /docker-entrypoint-initdb.d/

CMD ["mysqld","--character-set-server=utf8", "--collation-server=utf8_unicode_ci"]

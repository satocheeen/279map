from mysql:5.7

COPY ./init/* /docker-entrypoint-initdb.d/

CMD ["mysqld","--character-set-server=utf8mb4", "--collation-server=utf8mb4_bin"]

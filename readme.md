Выполнено тестовое задание https://docs.google.com/document/d/e/2PACX-1vTYfLgip1G1-GmLsU7T3RCmT52eoR1ZPOaSBkNWPCA0Db534AhNFm32lplolcTZGdHufBAjz_TrOrdZ/pub

На выполнение в сумме ушло около 3 часов, весь стек остался с шаблона, был добавлен фастифай сервер для быстрого запуска задач вне планировщика и добавления новых таблиц
http://localhost:5000/documentation

Для планового выполнения задач была добавлена библиотека node cron

Сам проект разделил на три отдельных сервиса по задачам 
 - database.service.ts
 - google.service.ts
 - wb.service.ts

В src\app.ts все обьеденино в один пайплайн 

Для тестирования оставил sheets-updater-config.json с доступом к таблице https://docs.google.com/spreadsheets/d/1E9FSbGB_fMY63OVZCfSaz5H0hXTGl5l-TH51cZNe9xI/edit?gid=0#gid=0

Для запуска проекта достаточно добавить в енв WB_API_TOKEN и запустить docker командой 

docker compose up -d --build



# TallyUp

Evolved MealTally repo to tally and track handouts of any sort to people in need. EX: Meal tally handing out meals. During pandemic handing out medical supplies

## Project setup

1. Install [Docker](https://docs.docker.com/get-docker/)
2. Install [bun](https://bun.sh/docs/installation)
3. `bun i`

## Development

### API Only

There are multiple ways to test backend + db interaction. This is my preferred way.

1. `docker compose up "db" "neonDbProxy" --build --force-recreate -d` to run the database and neon proxy in the background
2. `bun dev` to start the dev server
   Alternatively there is just
3. `docker compose up "db" "neonDbProxy" "api" --build --force-recreate -d` to run the database, neon proxy, and api in the background

### Full Stack

1. `docker compose up --build --force-recreate

### Cleanup

1. `docker compose down -v --remove-orphans` to stop and remove all containers, networks, and volumes created by `docker compose up`. This is necessary because docker images just stop working when they live too long.

## Large Texts

- [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML)
- [WAI](https://www.w3.org/WAI/standards-guidelines/aria/)
- [AWS Aurora DSQL](https://docs.aws.amazon.com/pdfs/aurora-dsql/latest/userguide/aurora-dsql-ug.pdf)

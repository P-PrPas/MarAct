from fastapi import APIRouter, HTTPException, Request
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from pydantic import BaseModel, Field


class RecordInput(BaseModel):
    title: str = Field(max_length=120)


class Record(BaseModel):
    id: int
    title: str


def records_router(list_query: str, insert_query: str) -> APIRouter:
    router = APIRouter()

    @router.get("/records")
    def list_records(request: Request) -> list[Record]:
        pool: ConnectionPool = request.app.state.pool
        with pool.connection() as connection, connection.cursor(row_factory=dict_row) as cursor:
            return [Record.model_validate(row) for row in cursor.execute(list_query)]

    @router.post("/records", status_code=201)
    def add_record(body: RecordInput, request: Request) -> Record:
        title = body.title.strip()
        if not title or "\x00" in title:
            raise HTTPException(400, "Enter a valid title of 1–120 characters.")
        pool: ConnectionPool = request.app.state.pool
        with pool.connection() as connection, connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(insert_query, (title,))
            return Record.model_validate(cursor.fetchone())

    return router

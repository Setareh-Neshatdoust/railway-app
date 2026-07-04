from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def root():
    return {"message": "Railway App API", "version": "1.0.0"}


@router.get("/health")
def health():
    return {"status": "ok"}

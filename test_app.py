import sys
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import SparkResponse, DebriefResponse

client = TestClient(app)

def test_full_flow():
    print("1. Тест /api/health...")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print("   Health check OK:", health_data["status"])

    print("2. Тест статического фронтенда...")
    res = client.get("/")
    assert res.status_code == 200, "Frontend index.html failed"
    assert "Арена переговоров" in res.text, "Index html content mismatch"
    print("   Frontend OK!")

    print("3. Тест старта сессии (POST /api/session/start)...")
    payload = {
        "persona_type": "shark",
        "scenario_id": "price_war",
        "user_batna": "Тестовая BATNA"
    }
    res = client.post("/api/session/start", json=payload)
    assert res.status_code == 200, f"Start session failed: {res.text}"
    session_data = res.json()["session"]
    session_id = session_data["session_id"]
    print(f"   Сессия создана: {session_id}")
    assert len(session_data["history"]) == 1, "Welcome message should be generated"
    print("   Первая реплика Spark:", session_data["history"][0]["text"][:60], "...")

    print("4. Тест реплики в чате (POST /api/chat)...")
    chat_payload = {
        "session_id": session_id,
        "user_message": "Ваша цена завышена в два раза. Давайте обсудим скидку 20% взамен на 100% предоплату."
    }
    res = client.post("/api/chat", json=chat_payload)
    assert res.status_code == 200, f"Chat failed: {res.text}"
    chat_res = res.json()
    print("   Ответ Spark получен:", chat_res["spark_reply"][:60], "...")
    print("   Дельты состояния:", chat_res["internal_state_delta"])
    print("   Текущие метрики:", chat_res["session"]["metrics"])

    print("5. Тест разбора (POST /api/session/debrief)...")
    debrief_payload = {
        "session_id": session_id
    }
    res = client.post("/api/session/debrief", json=debrief_payload)
    assert res.status_code == 200, f"Debrief failed: {res.text}"
    debrief_data = res.json()["debrief"]
    print("   Оценка:", debrief_data["score"])
    print("   Резюме:", debrief_data["summary"][:60], "...")
    print("   Сильных сторон найдено:", len(debrief_data["strengths"]))

    print("\n[SUCCESS] ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_flow()

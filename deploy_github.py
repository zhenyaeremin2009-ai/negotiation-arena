import os
import sys
import subprocess
import shutil

GIT_PATH = r"C:\Program Files\Git\cmd\git.exe"
if not os.path.exists(GIT_PATH):
    GIT_PATH = shutil.which("git") or "git"

GH_PATH = r"C:\Program Files\GitHub CLI\gh.exe"
if not os.path.exists(GH_PATH):
    GH_PATH = shutil.which("gh") or "gh"

def run_cmd(args, check=True):
    print(f"\n[Выполняется]: {' '.join(args)}")
    res = subprocess.run(args, capture_output=False, text=True)
    if check and res.returncode != 0:
        print(f"\n[Ошибка] Команда завершилась с кодом {res.returncode}")
        return False
    return True

def main():
    print("=" * 60)
    print("  🚀 Публикация «Арены переговоров» на GitHub")
    print("=" * 60)

    # 1. Ensure branch is main
    subprocess.run([GIT_PATH, "branch", "-M", "main"], capture_output=True)

    print("\nВыберите удобный вариант:")
    print("  [1] Автоматически через GitHub CLI (рекомендуется, создаст репозиторий сам)")
    print("  [2] Привязать к репозиторию по ссылке (если вы уже создали его на github.com)")
    print("  [3] Выход")

    choice = input("\nВаш выбор (1, 2 или 3): ").strip()

    if choice == "1":
        # Check gh auth status
        auth_check = subprocess.run([GH_PATH, "auth", "status"], capture_output=True, text=True)
        if auth_check.returncode != 0:
            print("\n[1/2] Требуется авторизация в GitHub.")
            print("Сейчас откроется браузер. Нажмите 'Authorize github' для подтверждения...\n")
            login_res = subprocess.run([GH_PATH, "auth", "login", "--web", "-h", "github.com"])
            if login_res.returncode != 0:
                print("\n[!] Ошибка авторизации. Попробуйте вариант 2.")
                return

        print("\n[2/2] Создаем публичный репозиторий 'negotiation-arena' и отправляем код...")
        # Remove existing remote if invalid
        subprocess.run([GIT_PATH, "remote", "remove", "origin"], capture_output=True)

        res = subprocess.run([GH_PATH, "repo", "create", "negotiation-arena", "--public", "--source=.", "--remote=origin", "--push"])
        if res.returncode != 0:
            print("\n[!] Если репозиторий negotiation-arena уже существует в вашем аккаунте, отправляем в него:")
            subprocess.run([GIT_PATH, "push", "-u", "origin", "main"])

    elif choice == "2":
        repo_url = input("\nВставьте ссылку на ваш репозиторий (например, https://github.com/USER/arena.git): ").strip()
        if not repo_url:
            print("Ссылка не указана.")
            return

        subprocess.run([GIT_PATH, "remote", "remove", "origin"], capture_output=True)
        if not run_cmd([GIT_PATH, "remote", "add", "origin", repo_url]):
            return

        print("\nОтправляем ветку main на GitHub...")
        if not run_cmd([GIT_PATH, "push", "-u", "origin", "main"]):
            print("\n[!] Не удалось отправить. Проверьте права доступа и правильность ссылки.")
            return
    else:
        print("Выход.")
        return

    print("\n" + "=" * 60)
    print("  ✅ УСПЕХ! Проект отправлен на GitHub.")
    print("=" * 60)
    print("""
  ЧТОБЫ САЙТ ОТКРЫВАЛСЯ В БРАУЗЕРЕ У ВСЕХ (GitHub Pages):
  1. Перейдите в ваш репозиторий на сайте github.com
  2. Нажмите вкладку 'Settings' (вверху справа)
  3. В меню слева выберите 'Pages'
  4. В пункте 'Build and deployment':
     - Source: Deploy from a branch
     - Branch: main
     - Folder: / (root)
  5. Нажмите 'Save'

  Через 1-2 минуты сайт станет доступен по прямой ссылке:
  👉 https://ВАШ_НИКНЕЙМ.github.io/negotiation-arena/
    """)
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nОтменено пользователем.")

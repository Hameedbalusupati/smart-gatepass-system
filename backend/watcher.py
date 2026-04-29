import time
import os

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from import_students import import_excel


# 🔥 IMPORTANT: CHANGE THIS PATH
WATCH_PATH = r"C:\Users\hamee\OneDrive\Desktop\smart_gatepass\backend"

EXCEL_FILE_NAME = "Student_dataset_phone_numbers.xlsm"


class ExcelHandler(FileSystemEventHandler):

    def process(self, event):
        if event.is_directory:
            return

        # 🔍 Debug full path
        print("DEBUG:", event.src_path)

        file_path = event.src_path.lower()

        # Match excel file anywhere in path
        if EXCEL_FILE_NAME.lower() in file_path:
            print("\n📢 Excel change detected!")
            print("🔄 Syncing database...\n")

            try:
                import_excel()
                print("✅ Sync completed\n")
            except Exception as e:
                print("🔥 Sync Error:", e)

    def on_modified(self, event):
        self.process(event)

    def on_created(self, event):
        self.process(event)

    def on_moved(self, event):
        self.process(event)


def start_watcher():
    observer = Observer()
    handler = ExcelHandler()

    # 🔥 recursive=True VERY IMPORTANT
    observer.schedule(handler, path=WATCH_PATH, recursive=True)
    observer.start()

    print("👀 Watching folder:", WATCH_PATH)
    print("📂 Tracking file:", EXCEL_FILE_NAME)

    # Initial import
    try:
        print("\n🚀 Initial import running...\n")
        import_excel()
        print("✅ Initial import done\n")
    except Exception as e:
        print("🔥 Initial Import Error:", e)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping watcher...")
        observer.stop()

    observer.join()


if __name__ == "__main__":
    start_watcher()
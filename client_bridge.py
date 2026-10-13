# קובץ client_bridge.py - פרויקט הלקוח
import socket  #ייבוא הספרייה המובנית של פייתון לניהול רשתות ותקשורת
import json    #ייבוא הספרייה שמטפלת במבנה הנתונים JSON (JavaScript Object Notation)


def send_data_via_pure_socket(action_type, data_dict): #הגדרת פונקציה אסינכרונית/כללית שמקבלת שני פרמטרים
    try:  #פתיחת בלוק הגנה ובדיקת שגיאות זרימה
        # 1. יצירת סוקט TCP רגיל של פייתון
        client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM) #יצירת אובייקט סוקט חדש וקביעת פרוטוקול עבודה שלו

        # 2. התחברות לשרת הסוקטים בפורט 12345 שפתחתי ב-app.py
        client_socket.connect(('127.0.0.1', 12345))   #ביצוע חיבור פיזי אל השרת מאחורי הקלעים

        # 3. הכנת חבילת ה-JSON המשותפת
        payload = {
            'action': action_type,
            'data': data_dict
        }   #יצירת מילון פייתון חדש ומאורגן בשם payload

        # 4. קידוד ושליחת הנתונים כ-bytes ישירות בצינור הסוקט הפותח
        client_socket.sendall(json.dumps(payload).encode('utf-8'))  #הפיכת מילון למחרוזת בפורמט JSON, הפיכת מחרוזת למערך ביטים בקידוד בינלאומי, שליחת מערך הביטים אל השרת באמצעות TCP

        # 5. קבלת התשובה והאימות מהשרת דרך הסוקט
        server_response = client_socket.recv(4096) #הלקוח מחכה לתשובה חוזרת מהשרת
        response_json = json.loads(server_response.decode('utf-8'))

        client_socket.close()  # סגירת הסוקט
        return response_json

    except Exception as e:
        return {'success': False, 'message': f'Socket error: {e}'}

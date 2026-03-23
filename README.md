# Core Inventory Management System (IMS)

A modular, real-time Inventory Management System designed to digitize and streamline warehouse operations. This system replaces manual registers with a centralized, premium digital interface.

## 🚀 Tech Stack

- **Frontend**: React, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Django (Python), Django REST Framework.
- **Database**: SQLite (Development) / MongoDB.
- **Tools**: Axios, Lucide React.

## 🎨 Design Philosophy

- **Premium Aesthetics**: Sleek dark mode, glassmorphism, and high-fidelity micro-animations.
- **Modular Architecture**: Reusable components like `CustomDropdown` and `AnimatedCard`.
- **Dynamic UX**: Real-time feedback and smooth transitions.

## 📂 Project Structure

- `web-client/`: Modern React-based frontend application.
- `core_api/`: Robust Django-based backend API.
- `requirements.txt`: Python dependencies.

## 👥 Team & Task Distribution

### **SHLOK**
- **Frontend Development**: Implementation of premium components and animated interfaces.
- **Connectivity**: Managing API integrations, state management, and data flow between client and server.

### **BHAVYA**
- **DB & Backend**: Designing database schemas (SQLite/MongoDB) and implementing core Python/Django logic.
- **API Architecture**: Building robust backend endpoints for inventory operations.

### **JYOTI**
- **Frontend Help**: Assisting with UI component building, styling, and ensuring design consistency.
- **UX Refinement**: Helping polish micro-animations and responsive layouts.

### **ARYAN**
- **Backend Specialist**: Working alongside BHAVYA on server-side logic and operational workflows.
- **Quality Assurance**: Testing backend endpoints and ensuring operational reliability.

---

## 🛠️ Getting Started

### Backend Setup
1. `cd core_api`
2. Create and active virtual environment.
3. `pip install -r requirements.txt`
4. `python manage.py migrate`
5. `python manage.py runserver`

### Frontend Setup
1. `cd web-client`
2. `npm install`
3. `npm run dev`

# Usa Python 3.10 como base
FROM python:3.10

# Establece el directorio de trabajo
WORKDIR /app

CMD ["sh", "./start.sh"]

# Copia los archivos del proyecto
COPY . /app

# Instala las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Expone el puerto 8080
EXPOSE 8080

# Comando para ejecutar la aplicación
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]


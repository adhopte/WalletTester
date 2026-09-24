FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production
RUN apk add --no-cache gettext

# Install Nginx
RUN apk add --no-cache nginx

# Copy Angular build to Nginx HTML dir
COPY /dist/in-person-portal/browser /usr/share/nginx/html/in-person-portal

# Copy Nginx config
COPY nginx_ui.conf /etc/nginx/http.d/nginx_ui.conf
RUN rm /etc/nginx/http.d/default.conf

# Copy server.js and package.json for Node backend
COPY  /src/sor/*.* /app/

# Copy env substitution script if needed
COPY ./entrypoint.sh /app/entrypoint.sh
RUN dos2unix /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

#default values if missing in helm
ENV SOR_SERVER_PORT=8082
ENV DEFAULT_FLOWS='["COL_RNEC", "PASSPORT_INPERSON", "FINLAND_MNO"]'
ENV HOST_SPECIFIC_FLOWS='{}'
ENV SUPPORTED_USE_CASES='["classic","dtc_type1_inp"]'
ENV DTC_FLOW_NAME='ICAO_INPERSON-DTC'
ENV DTC_DATA_FILE='/in-person-portal/assets/jsons/dtc_type1_data.json'
ENV USER_PID_CLAIMS_FILE='/in-person-portal/assets/jsons/user_pid_claims.json'
ENV USER_DEGREE_CLAIMS_FILE='/in-person-portal/assets/jsons/user_degree_claims.json'
ENV PID_CLAIMS_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/user_pid_claims.json'
ENV DEGREE_CLAIMS_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/user_degree_claims.json'
ENV USER_BIRTH_CERTIFICATE_CLAIMS_SD_JWT_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/birth_certificate_claims_sd_jwt.json'
ENV BIRTH_CERTIFICATE_CLAIMS_SD_JWT_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/birth_certificate_claims_sd_jwt.json'
ENV USER_BIRTH_CERTIFICATE_CLAIMS_MDOC_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/birth_certificate_claims_mdoc.json'
ENV BIRTH_CERTIFICATE_CLAIMS_MDOC_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/birth_certificate_claims_mdoc.json'
ENV OID_4_VCI_HOST=''
ENV SOR_HOST=''
ENV UC2_CRED_NAME='eu.europa.ec.eudi.tax_sd_jwt_vc'
ENV TAX_AGENCY_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/tax_agency_claims.json'
ENV PSEUDONYM_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/pseudonym_claims.json'
ENV POR_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/por_claims.json'
ENV PHOTOS_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/photos_claims.json'
ENV PDA_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/pda_claims.json'
ENV TELECOM_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/telecom_claims.json'
ENV MDL_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/mobile_driving_license_claims.json'
ENV IBAN_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/iban_claims.json'
ENV HEALTH_ID_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/health_id_claims.json'
ENV HEALTH_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/health_claims.json'
ENV COR_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/cor_claims.json'
ENV BOOKING_REGISTRATION_FILE='/usr/share/nginx/html/in-person-portal/assets/jsons/booking_registration_claims.json'



# Expose both ports
EXPOSE 80 8082


# Start both Nginx and Node
CMD ["/bin/sh", "-c", "/app/entrypoint.sh"]

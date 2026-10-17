{{- define "store.labels" -}}
app.kubernetes.io/part-of: urumi-platform
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "store.siteUrl" -}}
{{ .Values.global.scheme }}://{{ .Values.global.storeHost }}{{ with .Values.global.publicPort }}:{{ . }}{{ end }}
{{- end }}

{{- define "store.wpEnv" -}}
- name: WORDPRESS_DB_HOST
  value: mysql
- name: WORDPRESS_DB_NAME
  value: wordpress
- name: WORDPRESS_DB_USER
  value: wordpress
- name: WORDPRESS_DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Values.secretName }}
      key: mysql-password
- name: WORDPRESS_CONFIG_EXTRA
  value: |
    define('WP_HOME', '{{ include "store.siteUrl" . }}');
    define('WP_SITEURL', '{{ include "store.siteUrl" . }}');
    if (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') { $_SERVER['HTTPS'] = 'on'; }
{{- end }}

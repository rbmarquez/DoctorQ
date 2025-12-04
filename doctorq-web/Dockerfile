
FROM registry-infra.transportes.gov.br/k8s/imagens/node:22-slim

# Definir timezone
ENV TZ=America/Sao_Paulo
ENV NODE_ENV=production

# Instalar pacotes necessários com root
RUN apt-get update -y \
  && apt-get install wget tzdata -y -qq \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Criar diretórios da aplicação
RUN mkdir -p /home/node/app /home/node/.npm

# Instalar npm
RUN npm install -g --silent npm@11

# Configurar permissões
RUN chown -R node:node /home/node/ \
  && chown -R node:node /usr/local/lib/node_modules \
  && chmod -R 777 /home/node/

# Configurar cache do npm
ENV NPM_CONFIG_CACHE=/home/node/.npm

# Alterar para usuário node para operações seguras
USER node

# Área de trabalho
WORKDIR /home/node/app

# Copiar arquivos da aplicação (gerados pelo CI/CD)
COPY --chown=node:node .next .next/
COPY --chown=node:node node_modules node_modules/
# COPY --chown=node:node public public/
COPY --chown=node:node package.json .
COPY --chown=node:node yarn.lock .

# Configurar variáveis de ambiente e expor porta
# ENV DEBUG=next:*
# ENV NEXT_DEBUG_BUILD=1
# ENV NEXT_DEBUG_SERVER=1
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

# Comando para iniciar a aplicação Next.js
CMD ["npm", "start"]

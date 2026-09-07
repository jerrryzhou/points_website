FROM public.ecr.aws/lambda/nodejs:20

# postgresql17 matches Supabase's server version (pg_dump must be >= server version)
RUN dnf install -y postgresql17 && dnf clean all

COPY package.json ./
RUN npm install --omit=dev

COPY index.js ./

CMD ["index.handler"]

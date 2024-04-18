/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone'
};


export default nextConfig;

export async function getServerSideProps() {
    return { props: {} };
  }
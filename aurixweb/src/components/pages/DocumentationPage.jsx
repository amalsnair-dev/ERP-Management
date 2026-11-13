import React from "react";
import ModulePageLayout from "../layout/ModulePageLayout";
import { useNavigate } from "react-router-dom";

const Documentation = () => {
  const navigate = useNavigate();

  return (
    <ModulePageLayout title="Developer Documentation" navigate={navigate}>
      <div className="p-6 max-w-5xl mx-auto text-sm leading-7">

        <h1 className="text-3xl font-bold mb-4">
          Aurix Web – Public Developer Documentation
        </h1>

        <h2 className="text-xl font-semibold mt-8 mb-2">Welcome</h2>
        <p>
          Welcome to the Aurix Web Developer Documentation.
          Aurix Web is a modern Jewellery ERP platform developed by Blogtec
          Software LLP. This documentation helps developers understand how to
          integrate with Aurix Web APIs and build applications that communicate
          securely with the platform.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Getting Started</h2>
        <p>This documentation explains:</p>
        <ul className="list-disc ml-6">
          <li>Platform Overview</li>
          <li>Authentication</li>
          <li>API Reference</li>
          <li>Request & Response Format</li>
          <li>Error Codes</li>
          <li>Best Practices</li>
          <li>SDK Examples</li>
          <li>Release Notes</li>
          <li>Frequently Asked Questions</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          Platform Overview
        </h2>
        <p>
          Aurix Web is a cloud-ready Jewellery ERP solution designed for
          jewellery retailers, wholesalers, and multi-branch businesses.
        </p>

        <p className="mt-3 font-medium">Main modules include:</p>
        <ul className="list-disc ml-6">
          <li>Sales Entry</li>
          <li>Purchase Management</li>
          <li>Inventory Management</li>
          <li>Barcode Management</li>
          <li>Customer Management</li>
          <li>Daily Customer Tracking</li>
          <li>Cash Marking</li>
          <li>Reports & Analytics</li>
          <li>User Management</li>
          <li>Multi-Branch Support</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">Authentication</h2>
        <p>All API requests require authentication.</p>

        <p className="mt-3 font-medium">Authentication methods:</p>
        <ul className="list-disc ml-6">
          <li>Username & Password</li>
          <li>API Key</li>
          <li>Bearer Token (JWT)</li>
        </ul>

        <ul className="list-disc ml-6 mt-3">
          <li>Always use HTTPS when accessing production APIs.</li>
          <li>Never share API credentials with anyone.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">Base URL</h2>

        <p>
          <strong>Production API</strong>
        </p>
        <code>https://api.yourdomain.com</code>

        <p className="mt-4">
          <strong>Sandbox API</strong>
        </p>
        <code>https://sandbox.yourdomain.com</code>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          API Documentation
        </h2>

        <p>
          Interactive API documentation is available through Swagger/OpenAPI.
        </p>

        <ul className="list-disc ml-6">
          <li>View available APIs</li>
          <li>Test endpoints</li>
          <li>Understand request parameters</li>
          <li>View response examples</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          Request Format
        </h2>

        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
{`{
  "shopCode": "SHOP01",
  "customerId": "1001"
}`}
        </pre>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          Response Format
        </h2>

        <p className="font-medium">Success</p>

        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
{`{
  "status": true,
  "message": "Success",
  "data": {}
}`}
        </pre>

        <p className="font-medium mt-4">Error</p>

        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
{`{
  "status": false,
  "message": "Invalid Request"
}`}
        </pre>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          HTTP Status Codes
        </h2>

        <table className="border border-gray-300 w-full">
          <thead>
            <tr>
              <th className="border p-2">Code</th>
              <th className="border p-2">Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="border p-2">200</td><td className="border p-2">Success</td></tr>
            <tr><td className="border p-2">201</td><td className="border p-2">Created</td></tr>
            <tr><td className="border p-2">400</td><td className="border p-2">Bad Request</td></tr>
            <tr><td className="border p-2">401</td><td className="border p-2">Unauthorized</td></tr>
            <tr><td className="border p-2">403</td><td className="border p-2">Forbidden</td></tr>
            <tr><td className="border p-2">404</td><td className="border p-2">Not Found</td></tr>
            <tr><td className="border p-2">500</td><td className="border p-2">Internal Server Error</td></tr>
          </tbody>
        </table>

        <h2 className="text-xl font-semibold mt-8 mb-2">Features</h2>

        <ul className="list-disc ml-6">
          <li>Jewellery Billing</li>
          <li>Gold & Silver Sales</li>
          <li>Diamond Billing</li>
          <li>Barcode Printing</li>
          <li>Barcode Scanning</li>
          <li>Customer CRM</li>
          <li>Purchase Entry</li>
          <li>Reports</li>
          <li>Multi-Shop Support</li>
          <li>User Access Control</li>
          <li>Progressive Web App (PWA)</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">Security</h2>

        <ul className="list-disc ml-6">
          <li>Use HTTPS</li>
          <li>Protect API credentials</li>
          <li>Rotate API keys regularly</li>
          <li>Validate all input data</li>
          <li>Follow least-privilege access principles</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          SDK & Code Examples
        </h2>

        <ul className="list-disc ml-6">
          <li>Java</li>
          <li>JavaScript</li>
          <li>TypeScript</li>
          <li>PHP</li>
          <li>Python</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          Release Notes
        </h2>

        <ul className="list-disc ml-6">
          <li>New Features</li>
          <li>Improvements</li>
          <li>Bug Fixes</li>
          <li>Security Updates</li>
          <li>Deprecated APIs</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">FAQ</h2>

        <p><strong>How do I obtain API access?</strong></p>
        <p>Contact your system administrator or the Aurix Web support team.</p>

        <p className="mt-4"><strong>Is Swagger available?</strong></p>
        <p>Yes. Interactive API documentation is provided.</p>

        <p className="mt-4"><strong>Is HTTPS required?</strong></p>
        <p>Yes. Production integrations should always use HTTPS.</p>

        <p className="mt-4">
          <strong>Does Aurix Web support mobile devices?</strong>
        </p>
        <p>
          Yes. Aurix Web is a Progressive Web Application (PWA) and works
          across desktop, tablet, and mobile devices.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Support</h2>
        <p>
          If you need technical assistance, contact the Aurix Web support team
          through the official support channels provided by your organization.
        </p>

        <hr className="my-8" />

        <p className="text-center text-gray-500">
          © Blogtec Software LLP. All rights reserved.
        </p>

      </div>
    </ModulePageLayout>
  );
};

export default Documentation;
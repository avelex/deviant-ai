[Skip to content](https://0g-labs.notion.site/0G-Tapp-2bed6515e143809dbf54df5477fd3db4#main)

# 0G Tapp

Trusted Application Platform: A TEE-Based Secure Operations Solution

### ![📋](<Base64-Image-Removed>) Table of Contents

[![📖](<Base64-Image-Removed>) Chapter 0. Executive Summary](https://0g-labs.notion.site/2bed6515e143809dbf54df5477fd3db4?pvs=25#2c0d6515e143806aa214f0cfebefbc06)

![🤖](<Base64-Image-Removed>)[Chapter 1: TEE Technology Fundamentals](https://0g-labs.notion.site/2bed6515e143809dbf54df5477fd3db4?pvs=25#2bed6515e14380a3b6b3f9b202917c63)

![🔐](<Base64-Image-Removed>)[Chapter 2: Security Blind Spots](https://0g-labs.notion.site/2bed6515e143809dbf54df5477fd3db4?pvs=25#2bed6515e14380bbb540ede1e6f54b2e)

![🛡️](<Base64-Image-Removed>)[Chapter 3: The 0G Tapp Solution](https://0g-labs.notion.site/2bed6515e143809dbf54df5477fd3db4?pvs=25#2bed6515e14380dbbb0fe702aa083096)

![🏗️](<Base64-Image-Removed>)[Chapter 4: System Architecture](https://0g-labs.notion.site/2bed6515e143809dbf54df5477fd3db4?pvs=25#2bed6515e143809ebfb7eb5729390a72)

![⚡](<Base64-Image-Removed>)[Chapter 5: Technical Advantages](https://0g-labs.notion.site/2bed6515e143809dbf54df5477fd3db4?pvs=25#2bed6515e14380509399fdfb814c0b90)

![🎯](<Base64-Image-Removed>)[Chapter 6: Conclusion](https://0g-labs.notion.site/2bed6515e143809dbf54df5477fd3db4?pvs=25#2bed6515e14380749409e6eb36fc84f4)

### ![📖](<Base64-Image-Removed>) 0\. Executive Summary

#### ![🎯](<Base64-Image-Removed>) The Problem We're Solving

Modern secure computing environments (TEEs like Intel TDX) create hardware-protected fortresses for applications—impenetrable walls that keep out cloud providers, administrators, and hackers. However, there's a critical challenge:

For routine operations (checking logs, restarting services), operators need access to what's inside. Traditionally, this is done through tools like SSH—essentially a "service door" into the fortress.

The vulnerability: While security measurements verify the fortress walls are strong, they cannot control what happens once someone enters through SSH. A malicious operator can:

![🔓](<Base64-Image-Removed>) Steal encryption keys from memory

![🔧](<Base64-Image-Removed>) Tamper with application behavior

![🚪](<Base64-Image-Removed>) Cover their tracks

The dilemma:

Keep SSH: Operations are convenient, but risk unauthorized access

Remove SSH: No unauthorized access, but system becomes unmanageable

#### ![🛡️](<Base64-Image-Removed>) The 0G Tapp Solution

Instead of choosing between security and operability, 0G Tapp provides a controlled service interface:

Three-Layer Defense:

![🚫](<Base64-Image-Removed>) Remove the Service Door: SSH and similar unrestricted tools are eliminated

![🔧](<Base64-Image-Removed>) Install a Service Window: A controlled API provides only pre-approved, auditable operations

![📊](<Base64-Image-Removed>) Monitor the Service Window: Cryptographic measurements ensure both the service window (Tapp) and all application operations haven't been tampered with

Key Benefits:

![✅](<Base64-Image-Removed>) Operators can perform necessary maintenance through restricted APIs

![✅](<Base64-Image-Removed>) All actions are logged in tamper-proof audit trails

![✅](<Base64-Image-Removed>) Critical operations require multi-party authorization

![✅](<Base64-Image-Removed>) Users can independently verify system integrity

#### ![🚀](<Base64-Image-Removed>) Real-World Applications

0G Tapp enables trustworthy applications in scenarios where trust is critical: decentralized oracles, cross-chain bridges, privacy computing, confidential data analysis, and multi-party collaborative systems.

Ready to dive deeper? The following chapters explain the technical details of how 0G Tapp achieves this level of security while maintaining practical operability.

### ![🤖](<Base64-Image-Removed>) 1\. TEE Technology Fundamentals

#### ![🛡️](<Base64-Image-Removed>) 1.1 What is a Trusted Execution Environment?

A Trusted Execution Environment (TEE) is a hardware-based security technology that leverages processor-level security features to create isolated, protected execution regions within computing systems.

![💡](<Base64-Image-Removed>)Core Principles: Hardware-level isolation + Encryption protection + Verifiable execution

#### ![⚙️](<Base64-Image-Removed>) 1.2 Core TEE Security Features

#### ![🔒](<Base64-Image-Removed>)Memory Isolation and Encryption

| Accessor | Permission | Description |
| --- | --- | --- |
| OS/Hypervisor/Admin | ![❌](<Base64-Image-Removed>) Denied | Cannot access TEE memory |
| TEE Internal Code | ![✅](<Base64-Image-Removed>) Allowed | Full access rights |

![🔐](<Base64-Image-Removed>) Memory contents are protected by hardware-level encryption with keys stored in hardware-protected secure regions

#### ![📊](<Base64-Image-Removed>)Runtime Measurement

At boot time, the system cryptographically records hash values of code and configuration, storing them in hardware-protected registers (Intel TDX's RTMR).

RTMR = Hash(Kernel \|\| InitRAMFS \|\| Cmdline \|\| ...)

​

![🎯](<Base64-Image-Removed>)Key Properties: Measurements are hardware-generated and protected, locked after boot, and immutable at runtime

#### ![🌐](<Base64-Image-Removed>)Remote Attestation

Cryptographically proves to third parties that code is running in an authentic TEE environment.

Verification Flow: TEE generates attestation report → Report contains RTMR + hardware signature → Third party verifies signature and measurements → Confirms code runs in genuine TEE

#### ![🖥️](<Base64-Image-Removed>) 1.3 Intel TDX Technology

Intel Trust Domain Extensions (TDX) — VM-level confidential computing technology

| Concept | Description |
| --- | --- |
| ![🏰](<Base64-Image-Removed>) Trust Domain | Entire VM runs in protected isolated environment |
| ![🔐](<Base64-Image-Removed>) Memory Encryption | VM memory automatically encrypted by hardware, completely invisible externally |
| ![📊](<Base64-Image-Removed>) RTMR | Hardware-protected measurement registers recording system state |
| ![🌐](<Base64-Image-Removed>) Remote Attestation | Generates verifiable attestation reports based on hardware root of trust |

![🛡️](<Base64-Image-Removed>) Security Boundary: External zone (cloud providers, virtualization layer, deployers) is untrusted; internal zone (applications, sensitive data, keys) is by trusted

### ![🔐](<Base64-Image-Removed>) 2\. Security Blind Spots in TDX Deployments

#### ![⚠️](<Base64-Image-Removed>) 2.1 The Core Challenge

![💭](<Base64-Image-Removed>)The Fundamental Tension: How do we balance operational requirements with security isolation?

While TDX provides robust hardware-level isolation, real-world deployments face a critical access control challenge: operational tools (like SSH) can be misused as channels from the external untrusted environment into the trusted TEE interior.

#### ![🚪](<Base64-Image-Removed>) 2.1.1 What Are "External-to-Internal Backdoors"?

![💡](<Base64-Image-Removed>)Backdoor Definition: Channels that allow entry from the untrusted external environment into the trusted TEE interior.

Common Backdoor Tools: SSH daemon, Telnet, VNC/RDP, gdbserver, etc.

![🎯](<Base64-Image-Removed>)Shared Characteristics:

Listen on network ports or communication channels

Accept connection requests from outside the TDX boundary

Provide capability to enter TEE interior from external environment

After authentication, external users gain internal access privileges

![🔓](<Base64-Image-Removed>) How SSH-Based Backdoors Work:

Step 1 → SSH daemon listens on port inside TEE

Step 2 → Deployer initiates SSH connection from external environment

Step 3 → Passes authentication

Step 4 → Crosses security boundary to enter TEE interior

Step 5 → Executes arbitrary operations (read keys, modify configs, steal data)

#### ![🤔](<Base64-Image-Removed>) 2.1.2 The Core Contradiction

Limitations of Image Measurement:

![✅](<Base64-Image-Removed>)Image Measurement CAN Guarantee: Image contents match expectations, measurement values match, boot-time system state is correct

![❌](<Base64-Image-Removed>)Image Measurement CANNOT Prevent: Backdoor tools "legitimately included" in the image, deployers using these tools to enter from external to internal, runtime operations performed after entry

#### ![⚠️](<Base64-Image-Removed>) 2.1.3 Concrete Threat Scenarios

![🚨](<Base64-Image-Removed>) Scenario 1: Key Theft via Backdoor

Application starts and retrieves keys from KBS

Deployer enters TDX interior via SSH

Locates and steals keys from within TDX

Exfiltrates keys to attacker's server

![⚠️](<Base64-Image-Removed>)Threat Analysis: Measurement values remain unchanged, SSH daemon is a "legitimate" image component, external observers cannot detect key leakage

![🚨](<Base64-Image-Removed>) Scenario 2: Application Logic Tampering via Backdoor

Deployer enters TDX interior via SSH

Modifies application configuration, redirecting data source to malicious server

Restarts service to apply changes

Clears operation traces

![⚠️](<Base64-Image-Removed>)Threat Analysis: Application begins reporting incorrect data, but measurement values remain unchanged, external observers cannot detect tampering

#### ![🤔](<Base64-Image-Removed>) 2.2 Why Image Measurement Cannot Solve This

![💭](<Base64-Image-Removed>)Root Cause: System images must include operational tools to support normal operations, but these tools can be misused as backdoors.

![⚖️](<Base64-Image-Removed>) The Dilemma:

| Option | Configuration | Advantages | Disadvantages |
| --- | --- | --- | --- |
| Option A | Image includes backdoor tools | Enables routine operations | Deployers can enter from external to internal |
| Option B | Image excludes backdoor tools | Deployers cannot enter from external | Cannot perform routine operations |

![🔒](<Base64-Image-Removed>) Critical Limitation: Measurements occur at system boot and lock into RTMR; runtime operations through backdoor tools don't trigger RTMR updates; external observers cannot access TDX-internal operation logs

### ![🛡️](<Base64-Image-Removed>) 3\. The 0G Tapp Solution

#### ![🎯](<Base64-Image-Removed>) 3.1 Design Goals

0G Tapp (Trusted Application Platform) addresses the "external-to-internal backdoor" problem through a three-layer defense architecture:

| Defense Layer | Core Strategy |
| --- | --- |
| Layer 1 | ![🚫](<Base64-Image-Removed>) Remove Backdoors - Eliminate SSH and other privileged tools from system image |
| Layer 2 | ![🔧](<Base64-Image-Removed>) Controlled Interface - Provide restricted operational interface (Tapp service) |
| Layer 3 | ![📊](<Base64-Image-Removed>) Integrity Assurance - Use cryptographic measurements to ensure Tapp service hasn't been tampered with |

#### ![🚫](<Base64-Image-Removed>) 3.2 Layer 1: Removing External-to-Internal Backdoors

#### ![🔍](<Base64-Image-Removed>) 3.2.1 Identifying Components to Remove

![🎯](<Base64-Image-Removed>)Backdoor Characteristics: Listens on network ports, provides interactive access, unrestricted privileges

Typical Components to Remove:

| Component Type | Specific Tools | Misuse Risk |
| --- | --- | --- |
| ![🔌](<Base64-Image-Removed>) Remote Login | SSH daemon, Telnet | Full control access |
| ![💻](<Base64-Image-Removed>) Command Execution | bash/shell | Unrestricted operations |
| ![🔬](<Base64-Image-Removed>) Debugging Tools | gdb/debugger | Key theft, code injection |
| ![⚙️](<Base64-Image-Removed>) Service Control | systemctl | Start/stop arbitrary services |
| ![📝](<Base64-Image-Removed>) File Editors | vi/nano | Config tampering, code injection |

#### ![🏗️](<Base64-Image-Removed>) 3.2.2 Minimal Privilege System Image

![✅](<Base64-Image-Removed>)Core Runtime (Retained): Linux kernel, base system libraries, Docker Engine, Tapp gRPC service

![❌](<Base64-Image-Removed>)Explicitly Removed: SSH daemon, interactive shells, systemctl, text editors, debugging tools, package managers, remote desktop

![💡](<Base64-Image-Removed>)Design Principle: "If it can enable entry from external to internal, remove it"

#### ![🔧](<Base64-Image-Removed>) 3.3 Layer 2: Tapp Controlled Operations Interface

#### ![🏗️](<Base64-Image-Removed>) 3.3.1 Tapp Architecture

Tapp is a Docker-based controlled operations service providing a restricted gRPC API interface.

Model Comparison:

| Dimension | Traditional (SSH) | Tapp (Controlled API) |
| --- | --- | --- |
| Access Method | Login from external to internal | Interact only via gRPC API |
| Permission Control | Unrestricted access | Only expose whitelisted operations |
| Operation Scope | Execute arbitrary commands | Each operation has permission validation |
| Audit Capability | Operations not effectively audited | All calls fully logged |

#### ![📋](<Base64-Image-Removed>) 3.3.2 API Design Principles

![🎯](<Base64-Image-Removed>)Principle of Least Privilege: Only expose necessary, safe operations.

![✅](<Base64-Image-Removed>) Supported Operations (Whitelist):

| Function Category | API Methods | Permission Requirements |
| --- | --- | --- |
| App Management | StartApp, StopApp, UpdateApp | ![🔑](<Base64-Image-Removed>) Requires multi-signature |
| Information Query | GetAppInfo, GetAppLogs | ![👀](<Base64-Image-Removed>) Read-only, no signature required |
| Attestation | GetEvidence, ListAppMeasurements | ![🌐](<Base64-Image-Removed>) Public interface |
| Key Management | GetAppKey, GetAppSecretKey | ![🔒](<Base64-Image-Removed>) Multi-signature + local call |

![❌](<Base64-Image-Removed>) Explicitly Prohibited: ExecuteCommand (arbitrary command execution), GetShell (shell access), ModifyFile (direct file modification), AttachDebugger (debugger attachment)

#### ![🔐](<Base64-Image-Removed>) 3.3.3 Multi-Signature Governance

Critical operations require multi-party signature authorization (M-of-N threshold scheme).

Authorization Flow:

Deployer initiates operation request

Generate operation description hash

Collect M signatures (e.g., 3-of-5)

Tapp verifies signatures

Execute or reject and log

![🛡️](<Base64-Image-Removed>)Security Guarantees: Prevents single-point control, complete audit trail, immutable logs, multi-party governance

#### ![📊](<Base64-Image-Removed>) 3.4 Layer 3: Tapp Integrity Assurance

#### ![⚠️](<Base64-Image-Removed>) 3.4.1 Why Measure Tapp?

![💭](<Base64-Image-Removed>)Threat Model: Malicious deployer tampers with Tapp service, adding

ExecuteCommand

API, disabling multi-signature verification, deleting audit logs.

![⚠️](<Base64-Image-Removed>) Without measurement mechanisms, users cannot detect Tapp tampering, and all protective measures are bypassed.

#### ![🔬](<Base64-Image-Removed>) 3.4.2 dm-verity-Based Integrity Protection

0G Tapp uses dm-verity technology to provide cryptographic integrity verification for system images.

How It Works:

Image Build Phase: Prepare system image → dm-verity builds Merkle tree → Calculate root hash → Application publisher releases root hash

System Boot Phase: Kernel parameters include root hash → TDX hardware measures kernel parameters into RTMR → dm-verity mounts image as read-only filesystem

Runtime Verification: Every read verifies data block hash; matching hash returns data, mismatching hash generates I/O error and halts system

![🎯](<Base64-Image-Removed>)Key Properties: Single byte modification changes root hash, root hash measured and locked by TDX hardware, system image mounted read-only

#### ![🌐](<Base64-Image-Removed>) 3.4.3 Remote Attestation Verification

Verification Flow:

Application publisher releases CVM image and Tapp build scripts (via 0G-storage, Github, etc.)

User calls

GetEvidence

API to obtain TDX Quote containing RTMR values

User verifies TDX signature validity, compares

Actual\_RTMR == Expected\_RTMR

User audits image for SSH backdoors, compares Tapp hash

![✅](<Base64-Image-Removed>) Match: Tapp is trusted controlled version

![❌](<Base64-Image-Removed>) Mismatch: Tapp has been tampered with, backdoor risk exists

dm-verity implementation is accomplished through the open-source Cryptpilot library

#### ![🔄](<Base64-Image-Removed>) 3.5 Three-Layer Defense Synergy

Defense Layer Structure:

| Layer | Name | Core Mechanism | Defense Target |
| --- | --- | --- | --- |
| Layer 1 | Remove Backdoors | Remove SSH/shell etc. from system image | Eliminate external-to-internal channels |
| Layer 2 | Controlled Interface | gRPC API + whitelist + multi-signature | Limit executable operation scope |
| Layer 3 | Integrity Assurance | dm-verity + TDX measurement + remote attestation | Ensure Tapp hasn't been tampered with |

Synergy Effect:

| Attack Vector | Layer 1 | Layer 2 | Layer 3 |
| --- | --- | --- | --- |
| Enter interior via backdoor tools | ![✅](<Base64-Image-Removed>) Backdoors removed | - | - |
| Execute arbitrary commands via API | - | ![✅](<Base64-Image-Removed>) API doesn't provide | - |
| Tamper Tapp to re-add backdoors | - | - | ![✅](<Base64-Image-Removed>) Measurement detects |
| Bypass multi-signature verification | - | - | ![✅](<Base64-Image-Removed>) Code protected by measurement |
| Single-party malicious operations | - | ![✅](<Base64-Image-Removed>) Requires multi-sig | - |

![💡](<Base64-Image-Removed>)Value: Defense in depth, verifiability, practical balance

#### ![🔐](<Base64-Image-Removed>) 3.6 Secure Key Management: Beyond the Three Layers

Now that we've established how 0G Tapp protects the operational interface, there's one more critical piece of the puzzle: how do we securely manage the encryption keys that protect application data?

Think back to our vault analogy. We've secured the service door (removed SSH), installed a controlled service window (Tapp API), and monitor the window frame (dm-verity + measurement). But what about the master keys that unlock the vault's contents? Where should they be stored?

#### ![🎯](<Base64-Image-Removed>) 3.6.1 What is a Key Broker Service (KBS)?

A Key Broker Service (KBS) is a system component that securely manages and distributes encryption keys to authorized applications. It acts as a trusted intermediary that:

Stores encryption keys needed by applications

Verifies requesters through remote attestation before releasing keys

Controls access to ensure only legitimate applications receive keys

How it fits into the system: When a Tapp application starts, it needs encryption keys to decrypt its data. Instead of storing keys locally (where they could be stolen), Tapp requests them from KBS. The KBS verifies Tapp's authenticity through remote attestation before securely delivering the keys.

#### ![🤔](<Base64-Image-Removed>) 3.6.2 The Key Management Challenge

Traditional KBS implementations store complete encryption keys in a single TEE node—essentially putting all your master keys in one lockbox. This creates several problems:

![💥](<Base64-Image-Removed>) What if that lockbox breaks? Hardware failures mean permanent key loss

![🔓](<Base64-Image-Removed>) What if someone picks the lock? Compromising one TEE means all keys are exposed

![🔗](<Base64-Image-Removed>) What if you need to upgrade the lockbox? Keys bound to specific hardware make migrations difficult

0G Tapp's Solution: Instead of one lockbox, we use multiple lockboxes across different locations, with each holding only a piece of the master key. This is our MPC+TEE architecture.

#### ![🔑](<Base64-Image-Removed>) 3.7 KBS: MPC+TEE-Based Key Management

#### ![⚠️](<Base64-Image-Removed>) 3.7.1 The Single Point of Failure Problem

In traditional approaches, complete keys are stored in a single TEE node, presenting these issues:

| Problem Type | Specific Risk |
| --- | --- |
| ![💥](<Base64-Image-Removed>) Single Point of Failure | TEE hardware failure → permanent key loss |
| ![🔓](<Base64-Image-Removed>) Security Risk | TEE compromise → complete key leakage |
| ![🔗](<Base64-Image-Removed>) Hardware Binding | Keys bound to specific TEE hardware, difficult upgrades |
| ![👤](<Base64-Image-Removed>) Trust Concentration | Must completely trust that TEE node |

#### ![🤝](<Base64-Image-Removed>) 3.7.2 MPC+TEE Architecture

Distributed KBS Cluster (Example: 5 nodes, 3-of-5 threshold)

Each TEE node holds only one key share, no single node can recover the complete key, any 3 shares can reconstruct the key (Shamir Secret Sharing).

MPC Protocol:

Initialization: Choose random polynomial

f(x) = K + a₁·x + a₂·x²

, generate shares

sᵢ = f(i)

, distribute to each TEE node

Reconstruction: Collect k ≥ 3 shares, recover key through Lagrange interpolation

K = f(0)

#### ![🔒](<Base64-Image-Removed>) 3.7.3 Dual Protection Mechanism

MPC Protection: Decentralization, fault tolerance (tolerates up to N-K node failures), attack resistance (requires compromising at least K nodes), no single point of failure, hardware independence

TEE Protection: Shares hardware-protected in TEE, measurements ensure MPC code hasn't been tampered with, hardware isolation prevents side-channel attacks, remote attestation verifies correct protocol execution

Solving Single Point of Failure and Hardware Binding:

| Scenario | Traditional Approach | MPC+TEE Approach |
| --- | --- | --- |
| Single TEE node failure | Permanent key loss | System continues, can generate new share replacement |
| TEE hardware upgrade | Keys bound to hardware, must replace simultaneously | Shares can migrate individually, not bound to single hardware |
| Single node compromised | Complete key leaked | Attacker only gets one share, cannot recover key |

#### ![🔗](<Base64-Image-Removed>) 3.7.4 Key Request Flow

Tapp (TDX) initiates request, generates remote attestation and broadcasts to all KBS nodes

KBS nodes independently verify TDX signature, RTMR values, application authorization

Each node's TEE executes MPC protocol computation, sends encrypted result to Tapp TEE

Tapp TEE reconstructs key, key K never leaves Tapp TEE

![🔑](<Base64-Image-Removed>)Critical Security Points: Shares never leave TEE, MPC computation occurs independently in each TEE, encrypted transmission, complete key exists only briefly in Tapp TEE

#### ![💾](<Base64-Image-Removed>) 3.8 Persistent Data Storage

Storage Architecture:

| Partition Type | Mount Point | Protection Mechanism | Characteristics |
| --- | --- | --- | --- |
| System Image | / | dm-verity | Read-only, immutable after boot |
| Data Partition | /data | dm-integrity | Writable, encrypted with KBS key |

dm-integrity Operation:

Write: Application writes data → Calculate checksum → Encrypt data → Store to disk

Read: Read from disk → Decrypt data → Verify checksum → Return data

![🛡️](<Base64-Image-Removed>)Security Guarantees: Confidentiality (KBS key encryption), integrity (dm-integrity detects tampering), persistence, isolation

### ![🏗️](<Base64-Image-Removed>) 4\. System Architecture

#### ![🏛️](<Base64-Image-Removed>) 4.1 Overall Architecture

Component Hierarchy (Top to Bottom):

#### ![👥](<Base64-Image-Removed>) Layer 1: Application User Layer

End users of applications, access services through application interfaces, can verify application runtime environment trustworthiness via remote attestation

#### ![📦](<Base64-Image-Removed>) Layer 2: Application Layer

Runs as Docker containers, applications isolated from each other, persistent storage via dm-integrity + encryption

#### ![🤖](<Base64-Image-Removed>) Layer 3: Tapp Service Layer

Tapp gRPC API: Authentication, multi-signature verification, application lifecycle management, KBS client, attestation & measurement, audit logging

Docker Engine: Container runtime

KBS Cluster: 5 independent TEE nodes, share storage, MPC protocol reconstructs keys

#### ![🛡️](<Base64-Image-Removed>) Layer 4: Security Infrastructure Layer

dm-verity: Protects system image

dm-integrity: Protects application data

Read-only Filesystem: System image mounted read-only

Remote Attestation: Generates TDX Quote containing RTMR

#### ![🖥️](<Base64-Image-Removed>) Layer 5: Hardware Layer

Intel TDX trust domain: VM-level memory isolation, hardware auto-encryption, RTMR, remote attestation, hardware root of trust

#### ![🛡️](<Base64-Image-Removed>) 4.2 Security Layers

| Level | Component | Protection Mechanism | Threat Defense |
| --- | --- | --- | --- |
| Hardware Root of Trust | Intel TDX | Memory encryption, hardware isolation, RTMR | External attacks, virtualization layer attacks |
| System Integrity | dm-verity | Merkle tree, cryptographic hash | Tapp tampering, backdoor re-introduction |
| Key Management | KBS Cluster | Shamir secret sharing, distributed TEE | Key theft, single point of failure |
| Application Data | dm-integrity | Data encryption, integrity verification | Data leakage, data tampering |
| Access Control | Tapp API | Whitelist, multi-signature, audit logs | Single-party malicious operations, privilege abuse |

### ![⚡](<Base64-Image-Removed>) 5\. Technical Advantages

#### ![🎯](<Base64-Image-Removed>) 5.1 Solving the Core Problem

0G Tapp's Defense Strategy:

| Layer | Strategy | Effect |
| --- | --- | --- |
| Layer 1 | Remove backdoor tools | Eliminate external-to-internal channels |
| Layer 2 | Provide controlled API | Limit executable operations, cannot execute arbitrary commands |
| Layer 3 | Measure Tapp and App | Ensure Tapp is restricted version, all App operations measured |

Supplement: KBS (MPC + TEE): Decentralization prevents theft, fault tolerance solves single point of failure, flexibility solves hardware binding

Alternative Approaches in the Industry

0G Tapp's system image approach is not the only way to deploy applications in TEE environments. The industry also offers CVM Management Platforms (such as Phala's TEE Stack), which operate at the host level to provide complete VM lifecycle management capabilities. These platforms are designed for building multi-tenant TEE-as-a-Service infrastructure.

Why We Chose the System Image Approach:

The key difference lies in deployment target and complexity. CVM platforms require bare metal servers and virtualization management expertise, making them ideal for infrastructure providers building TEE hosting services. However, for organizations that simply want to run their own applications securely in TEE, this introduces unnecessary complexity and infrastructure overhead.

0G Tapp takes a different path: we focus on solving the application operations security problem rather than the VM management problem. By providing a pre-hardened system image that runs on any cloud provider's TDX VMs, we achieve:

Lower barrier to entry: No bare metal or virtualization expertise needed

Cloud-native compatibility: Works directly on AWS/Azure/GCP TDX instances

Faster deployment: Boot an image instead of building infrastructure

Cost efficiency: Pay-per-VM instead of dedicated hardware

Migration flexibility: Move between cloud providers easily

In essence, we're bringing TEE security to standard cloud deployments, making it accessible to application developers without requiring them to become infrastructure operators.

#### ![📊](<Base64-Image-Removed>) 5.2 Solution Comparison

The TEE ecosystem offers different approaches to secure operations, each suited for specific deployment scenarios.

#### ![🔄](<Base64-Image-Removed>) Three Approaches Overview

| Dimension | Traditional TDX + SSH | CVM Management Platform | 0G Tapp |
| --- | --- | --- | --- |
| Architecture Level | Guest OS | Host-level virtualization | Guest OS image |
| Operations Interface | SSH/Shell | Platform management API | Controlled gRPC API |
| Deployment Target | Single TDX VM | Multiple CVMs | Single TDX VM |
| Infrastructure Requirement | TDX VM | Bare metal + VMM | TDX VM (cloud-compatible) |
| Management Scope | OS-level access | VM lifecycle management | Application operations |
| Security Approach | Trust-based | Platform-enforced | Image-hardened |
| Setup Complexity | Low (standard VM) | High (platform deployment) | Low (boot image) |
| Target Users | Development/testing | Infrastructure providers | Application developers |
| Ideal Scenario | Quick prototyping | Multi-tenant TEE hosting | Single-tenant production apps |
| Cost Model | VM cost | Bare metal + platform overhead | VM cost |
| Cloud Provider Support | Native | Requires dedicated environment | Compatible (AWS/Azure/GCP) |

#### ![💡](<Base64-Image-Removed>) Approach Characteristics

Traditional TDX + SSH

Standard Linux in TDX VM with SSH/shell access

Quick to set up for development and testing

![❌](<Base64-Image-Removed>)Security issue: SSH provides unrestricted access from external to internal, enabling key theft and tampering

Operations cannot be effectively audited or restricted

CVM Management Platform (e.g., Phala's TEE Stack)

Host-level infrastructure for managing multiple TEE VMs

Designed for building multi-tenant TEE services

Provides centralized control and lifecycle management

Requires bare metal infrastructure and virtualization expertise

0G Tapp

Pre-configured system image with controlled operations interface

Designed for running applications on cloud TEE VMs

Removes SSH/shell, provides restricted API with audit trails

Lower infrastructure overhead for single-application deployment

#### ![🛡️](<Base64-Image-Removed>) 5.3 Traditional vs Secure Solutions

The key security difference is between traditional approaches and modern secure solutions (including both CVM platforms and 0G Tapp), which share the same security goals.

| Threat Scenario | Traditional TDX + SSH | Secure Solutions (CVM Platform & 0G Tapp) |
| --- | --- | --- |
| Enter via backdoor | ![❌](<Base64-Image-Removed>) SSH provides unrestricted access | ![✅](<Base64-Image-Removed>) Backdoors removed, controlled interface |
| Execute arbitrary commands | ![❌](<Base64-Image-Removed>) Shell available | ![✅](<Base64-Image-Removed>) Restricted operations only |
| Single-party malicious ops | ![❌](<Base64-Image-Removed>) Operator can act alone | ![✅](<Base64-Image-Removed>) Multi-signature or governance required |
| Tamper with system | ![❌](<Base64-Image-Removed>) SSH tampering undetectable | ![✅](<Base64-Image-Removed>) Cryptographic measurement detects changes |
| Re-introduce backdoors | ![❌](<Base64-Image-Removed>) Possible via SSH | ![✅](<Base64-Image-Removed>) Measurement prevents |
| Steal keys | ![❌](<Base64-Image-Removed>) Via SSH memory dump | ![✅](<Base64-Image-Removed>) Secure KBS with access control |
| Hardware failure | ![❌](<Base64-Image-Removed>) Potential key loss | ![✅](<Base64-Image-Removed>) Distributed/backup strategies |
| Operation logging | ![⚠️](<Base64-Image-Removed>) Limited, not comprehensive | ![✅](<Base64-Image-Removed>) Complete audit trails |
| Tamper-proof trail | ![❌](<Base64-Image-Removed>) Logs can be modified | ![✅](<Base64-Image-Removed>) Immutable logging |

Note: Both CVM Management Platforms and 0G Tapp provide equivalent security guarantees. Their difference lies in deployment architecture (host-level vs guest-level) and target scenarios (multi-tenant hosting vs single-application deployment), not in security capabilities.

#### ![🎯](<Base64-Image-Removed>) 5.4 0G Tapp's Key Features

1\. Zero-Trust Operations Model

No privileged access tools in the system

API whitelist restricts possible operations

Multi-signature prevents single-party control

Even compromised operators cannot bypass security

2\. Verifiable Security

dm-verity + TDX provides cryptographic proof of integrity

TDX hardware measurements lock system state

Remote attestation enables independent verification

Users can verify, not just trust

3\. Distributed Key Management

MPC+TEE eliminates single point of failure

k-of-n threshold scheme (tolerates n-k failures)

Hardware-independent (shares can migrate)

Attack requires compromising k nodes

4\. Cloud-Compatible Deployment

Works on AWS/Azure/GCP TDX VMs

No bare metal infrastructure needed

Standard VM operations (start/stop/snapshot)

lower cost than dedicated infrastructure

5\. Engineering Maturity

Built on proven technologies (dm-verity (Cryptpilot), Docker, gRPC)

Lower risk than experimental security stacks

Open source and auditable (Cryptpilot)

#### ![💼](<Base64-Image-Removed>) 5.5 Practical Comparison

| Metric | Traditional Setup | CVM Platform | 0G Tapp |
| --- | --- | --- | --- |
| Deployment Time | Hours | Days-weeks | Hours |
| Infrastructure Cost | VM cost | Bare metal + platform | VM cost |
| Ops Complexity | Medium | High | Low |
| Security Risk | High (backdoors) | Low | Low |
| KMS Fault Tolerance | None | High (MPC) | High (MPC) |
| Cloud Compatibility | ![✅](<Base64-Image-Removed>) Yes | ![⚠️](<Base64-Image-Removed>) Limited | ![✅](<Base64-Image-Removed>) Compatible |
| Ideal Use Case | Testing/dev | Multi-tenant hosting | Production apps |

#### ![📋](<Base64-Image-Removed>) 5.6 When to Choose 0G Tapp

![✅](<Base64-Image-Removed>) Ideal for:

Decentralized oracles, cross-chain bridges

Privacy-preserving computation services

Applications requiring verifiable integrity

Cloud-compatible TEE deployments

![⚠️](<Base64-Image-Removed>) Consider alternatives for:

Building multi-tenant TEE hosting services (use CVM platforms)

Quick development/testing (traditional approach may suffice)

### ![🎯](<Base64-Image-Removed>) 6\. Conclusion

#### ![💡](<Base64-Image-Removed>) 6.1 Core Technical Points

0G Tapp provides a practical, cost-effective, highly secure solution by identifying and addressing the "external-to-internal backdoor" problem in TEE deployments.

Problem Diagnosis: Image measurement values are correct, but images legitimately include SSH daemon and other backdoor tools; deployers can enter from external to internal to execute operations; these runtime operations don't change measurement values; external observers cannot audit.

0G Tapp's Three-Layer Solution:

| Layer | Mechanism | Effect |
| --- | --- | --- |
| Layer 1 | Remove SSH/shell etc. | Eliminate external-to-internal channels |
| Layer 2 | gRPC API + whitelist + multi-sig | Can only perform restricted operations |
| Layer 3 | dm-verity + TDX measurement | Ensure Tapp is restricted version, all App operations measured |

KBS (MPC + TEE): Decentralization prevents theft, fault tolerance solves single point of failure, flexibility solves hardware binding

#### ![🌟](<Base64-Image-Removed>) 6.2 Representative Applications

![🤖](<Base64-Image-Removed>)0G AIverse \- iNFT trading platform

![🖥️](<Base64-Image-Removed>)0G Compute Network \- Distributed computing network

![🔮](<Base64-Image-Removed>)0G Tee Oracle \- iNFT transfer proof generation (TEE implementation)

#### ![📌](<Base64-Image-Removed>) 6.3 Applicable Scenarios

Decentralized oracles, cross-chain bridges, privacy computing, confidential data analysis, multi-party collaborative applications

#### ![🔧](<Base64-Image-Removed>) 6.4 Technical Features Summary

![🎯](<Base64-Image-Removed>)Minimal Trust Assumptions \- Don't trust deployers

![🔐](<Base64-Image-Removed>)Cryptographic Guarantees \- Based on dm-verity and TDX hardware measurements

![✅](<Base64-Image-Removed>)Verifiability \- Third parties can independently verify via remote attestation

![🔧](<Base64-Image-Removed>)Engineering Practicality \- Based on mature technologies (dm-verity, Docker, gRPC)

![📖](<Base64-Image-Removed>)Open Source Transparency \- Cryptpilot library is open source and auditable

#### ![🔗](<Base64-Image-Removed>) 6.5 Project Information

| Resource | Link |
| --- | --- |
| ![🔧](<Base64-Image-Removed>) 0G Tapp | [github.com/0gfoundation/0g-tapp](https://github.com/0gfoundation/0g-tapp) |
| ![✅](<Base64-Image-Removed>) Tapp Verifier | [github.com/0gfoundation/0g-tapp-verifier](https://github.com/0gfoundation/0g-tapp-verifier) |
| ![🤖](<Base64-Image-Removed>) AIverse | [aiverse.0g.ai/discover](https://aiverse.0g.ai/discover) |
| ![🖥️](<Base64-Image-Removed>) Compute Network | [docs.0g.ai/concepts/compute](https://docs.0g.ai/concepts/compute) |

### ![🎉](<Base64-Image-Removed>) Closing Remarks

Through an innovative three-layer defense architecture, 0G Tapp achieves practical operational capabilities while maintaining strong security guarantees. It not only solves the "external-to-internal backdoor" problem in TEE deployments but also provides a decentralized, fault-tolerant key management solution through the MPC+TEE hybrid architecture.

![🚀](<Base64-Image-Removed>)0G Tapp = Security + Practicality + Verifiability
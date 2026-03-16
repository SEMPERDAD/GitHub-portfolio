import Foundation
import UIKit
import MultipeerConnectivity

/// Real-time collaboration via MultipeerConnectivity.
/// Discovers nearby peers over Wi-Fi / Bluetooth and syncs scrapbook changes.
final class CollaborationService: NSObject, ObservableObject {

    // MARK: - Published state

    @Published var connectedPeers: [MCPeerID] = []
    @Published var isAdvertising = false
    @Published var isBrowsing = false

    // MARK: - Private MC objects

    private static let serviceType = "scrapbook-sync"
    private let localPeer: MCPeerID
    private let session: MCSession
    private let advertiser: MCNearbyServiceAdvertiser
    private let browser: MCNearbyServiceBrowser

    // MARK: - Callback

    /// Called on the main thread whenever remote data arrives.
    var onDataReceived: ((Data, MCPeerID) -> Void)?

    // MARK: - Init

    override init() {
        localPeer = MCPeerID(displayName: UIDevice.current.name)
        session = MCSession(peer: localPeer, securityIdentity: nil, encryptionPreference: .required)
        advertiser = MCNearbyServiceAdvertiser(peer: localPeer, discoveryInfo: nil, serviceType: Self.serviceType)
        browser = MCNearbyServiceBrowser(peer: localPeer, serviceType: Self.serviceType)
        super.init()
        session.delegate = self
        advertiser.delegate = self
        browser.delegate = self
    }

    // MARK: - Control

    func startSharing() {
        advertiser.startAdvertisingPeer()
        browser.startBrowsingForPeers()
        DispatchQueue.main.async { self.isAdvertising = true; self.isBrowsing = true }
    }

    func stopSharing() {
        advertiser.stopAdvertisingPeer()
        browser.stopBrowsingForPeers()
        session.disconnect()
        DispatchQueue.main.async { self.isAdvertising = false; self.isBrowsing = false }
    }

    // MARK: - Send

    func send(_ data: Data) {
        guard !session.connectedPeers.isEmpty else { return }
        try? session.send(data, toPeers: session.connectedPeers, with: .reliable)
    }

    func sendScrapbook(_ scrapbook: Scrapbook) {
        guard let data = try? JSONEncoder().encode(scrapbook) else { return }
        send(data)
    }
}

// MARK: - MCSessionDelegate

extension CollaborationService: MCSessionDelegate {
    func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
        DispatchQueue.main.async { self.connectedPeers = session.connectedPeers }
    }

    func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
        DispatchQueue.main.async { self.onDataReceived?(data, peerID) }
    }

    func session(_ session: MCSession, didReceive stream: InputStream,
                 withName streamName: String, fromPeer peerID: MCPeerID) {}
    func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String,
                 fromPeer peerID: MCPeerID, with progress: Progress) {}
    func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String,
                 fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}
}

// MARK: - MCNearbyServiceAdvertiserDelegate

extension CollaborationService: MCNearbyServiceAdvertiserDelegate {
    func advertiser(_ advertiser: MCNearbyServiceAdvertiser,
                    didReceiveInvitationFromPeer peerID: MCPeerID,
                    withContext context: Data?,
                    invitationHandler: @escaping (Bool, MCSession?) -> Void) {
        invitationHandler(true, session)
    }
}

// MARK: - MCNearbyServiceBrowserDelegate

extension CollaborationService: MCNearbyServiceBrowserDelegate {
    func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID,
                 withDiscoveryInfo info: [String: String]?) {
        browser.invitePeer(peerID, to: session, withContext: nil, timeout: 30)
    }

    func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {}
}

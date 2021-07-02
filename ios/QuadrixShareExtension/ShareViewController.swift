import UIKit
import Social
import MobileCoreServices

class ShareViewController: SLComposeServiceViewController {

	var sharedContent: [sharedContentType] = []
	let typeImage = kUTTypeImage as String
	let typeText = kUTTypeText as String
	let typeUrl = kUTTypeURL as String
	let typeFile = kUTTypeFileURL as String;

	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)

		self.handleContent()
	}

	private func handleContent() {

		if let content = extensionContext!.inputItems[0] as? NSExtensionItem {
			if let attachments = content.attachments {
				for (index, attachment) in (attachments).enumerated() {
					if attachment.hasItemConformingToTypeIdentifier(typeImage) {
						handleMedia(content: content, attachment: attachment, mediaType: typeImage, index: index)
					} else if attachment.hasItemConformingToTypeIdentifier(typeFile) {
						handleMedia(content: content, attachment: attachment, mediaType: typeFile, index: index)
					} else if attachment.hasItemConformingToTypeIdentifier(typeUrl) {
						handleText(content: content, attachment: attachment, textType: typeUrl, index: index)
					} else if attachment.hasItemConformingToTypeIdentifier(typeText) {
						handleText(content: content, attachment: attachment, textType: typeText, index: index)
					}
				}
			}
		}
	}

	private func handleMedia(content: NSExtensionItem, attachment: NSItemProvider, mediaType: String, index: Int) {

		// TODO: use async/await once swift 5.5 is released
		// and move redirectToApp call to handleContent function
		attachment.loadItem(forTypeIdentifier: mediaType, options: nil) { [weak self] data, error in

			let this = self
			let url = data as? URL
			let filePrefix = UUID().uuidString
			let fileExtension = url!.pathExtension
			let fileName = "\(filePrefix).\(fileExtension)"
			let mimeType = this!.getMimeType(fileExtension: fileExtension)
			let fileSize = this!.getFileSize(path: url!)
			let filePath = FileManager.default
				.containerURL(forSecurityApplicationGroupIdentifier: "group.ios.share.extension")!
				.appendingPathComponent(fileName)
			let isCopied = this!.copyFile(at: url!, to: filePath)

			if(isCopied) {
				this!.sharedContent.append(sharedContentType(uri: filePath.absoluteString, mimeType: mimeType, fileName: fileName, fileSize: fileSize))
			}

			if index == (content.attachments?.count)! - 1 {
				let sharedContentJson = this!.toJsonString(data: this!.sharedContent)
				let sharedContentEncoded = sharedContentJson.addingPercentEncoding(withAllowedCharacters: .urlFragmentAllowed)!
				this!.redirectToApp(sharedContentEncoded: sharedContentEncoded)
			}
		}
	}

	private func handleText (content: NSExtensionItem, attachment: NSItemProvider, textType: String, index: Int) {

		attachment.loadItem(forTypeIdentifier: textType, options: nil) { [weak self] data, error in

			let this = self
			let mimeType = "text/plain"
			var text = ""

			if textType == this!.typeUrl {
				let url = data as? URL
				text = url!.absoluteString
			} else {
				text = data as! String
			}

			this!.sharedContent.append(sharedContentType(uri: text, mimeType: mimeType, fileName: "", fileSize: 0))

			if index == (content.attachments?.count)! - 1 {
				let sharedContentJson = this!.toJsonString(data: this!.sharedContent)
				let sharedContentEncoded = sharedContentJson.addingPercentEncoding(withAllowedCharacters: .urlFragmentAllowed)!
				this!.redirectToApp(sharedContentEncoded: sharedContentEncoded)
			}
		}
	}

	private func redirectToApp(sharedContentEncoded: String) {

		let bundleId = Bundle.main.bundleIdentifier
		let n = bundleId!.lastIndex(of: ".") ?? bundleId!.endIndex
		let appBundleId = bundleId![..<n]
		let url = URL(string: "\(appBundleId)://sharedContent=\(sharedContentEncoded)")
		var responder = self as UIResponder?
		let selectorOpenURL = sel_registerName("openURL:")

		while (responder != nil) {
			if (responder?.responds(to: selectorOpenURL))! {
				let _ = responder?.perform(selectorOpenURL, with: url)
			}
			responder = responder!.next
		}
		extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
	}

	private func copyFile(at srcURL: URL, to dstURL: URL) -> Bool {
		do {
			if FileManager.default.fileExists(atPath: dstURL.path) {
				try FileManager.default.removeItem(at: dstURL)
			}
			try FileManager.default.copyItem(at: srcURL, to: dstURL)
		} catch {
			return false
		}
		return true
	}

	private func getMimeType(fileExtension: String) -> String {
		if let uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, fileExtension as NSString, nil)?.takeRetainedValue() {
			if let mimeType = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType)?.takeRetainedValue() {
				return mimeType as String
			}
		}
		return "application/octet-stream"
	}

	private func getFileSize(path: URL) -> Int {
		let resources = try? path.resourceValues(forKeys:[.fileSizeKey])
		return resources!.fileSize!
	}

	private func toJsonString(data: [sharedContentType]) -> String {
		let dataJson = try? JSONEncoder().encode(data)
		return String(data: dataJson!, encoding: .utf8)!
	}

	class sharedContentType: Codable {
		var uri: String
		var mimeType: String
		var fileName: String
		var fileSize: Int

		init(uri: String, mimeType: String, fileName: String, fileSize: Int) {
			self.uri = uri
			self.mimeType = mimeType
			self.fileName = fileName
			self.fileSize = fileSize
		}
	}
}
